using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Application.Support;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class SupportChatService(ApplicationDbContext dbContext, IDateTimeProvider clock) : ISupportChatService
{
    private const int MaxMessagesPerChat = 300;
    private const int MaxConversations = 200;
    private const string SupportTeamName = "Joviq Support";
    private const string StudentSupportUrl = "/dashboard?section=Support";

    public async Task<IReadOnlyList<SupportMessageResponse>> GetStudentMessagesAsync(Guid studentId, CancellationToken cancellationToken)
    {
        await MarkReadAsync(studentId, fromStudent: false, cancellationToken);
        var messages = await LoadMessagesAsync(studentId, cancellationToken);
        // Students talk to the team, not to individual admins.
        return messages.Select(message => Map(message, message.FromStudent ? "You" : SupportTeamName)).ToList();
    }

    public async Task<SupportMessageResponse> SendStudentMessageAsync(
        Guid studentId,
        SendSupportMessageRequest request,
        CancellationToken cancellationToken)
    {
        var message = await CreateMessageAsync(studentId, studentId, fromStudent: true, request, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(message, "You");
    }

    public async Task<SupportUnreadResponse> GetStudentUnreadAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var count = await dbContext.SupportMessages
            .CountAsync(x => x.StudentId == studentId && !x.FromStudent && x.ReadAt == null, cancellationToken);
        return new SupportUnreadResponse(count);
    }

    public async Task<IReadOnlyList<SupportConversationSummaryResponse>> GetConversationsAsync(
        string? search,
        CancellationToken cancellationToken)
    {
        var messages = dbContext.SupportMessages.AsNoTracking();
        var term = search?.Trim().ToLower();
        if (!string.IsNullOrEmpty(term))
        {
            var matchingStudents = dbContext.Users
                .Where(x => x.FullName.ToLower().Contains(term) || (x.Email != null && x.Email.ToLower().Contains(term)))
                .Select(x => x.Id);
            messages = messages.Where(x => matchingStudents.Contains(x.StudentId));
        }

        var chats = await messages
            .GroupBy(x => x.StudentId)
            .Select(group => new
            {
                StudentId = group.Key,
                LastMessageAt = group.Max(x => x.CreatedAt),
                UnreadCount = group.Count(x => x.FromStudent && x.ReadAt == null)
            })
            .OrderByDescending(x => x.UnreadCount > 0)
            .ThenByDescending(x => x.LastMessageAt)
            .Take(MaxConversations)
            .ToListAsync(cancellationToken);

        var studentIds = chats.Select(x => x.StudentId).ToList();
        var students = await dbContext.Users.AsNoTracking()
            .Where(x => studentIds.Contains(x.Id))
            .Select(x => new { x.Id, x.FullName, x.Email })
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        var lastMessages = await dbContext.SupportMessages.AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId))
            .GroupBy(x => x.StudentId)
            .Select(group => group.OrderByDescending(x => x.CreatedAt).First())
            .ToDictionaryAsync(x => x.StudentId, cancellationToken);

        return chats.Select(chat =>
        {
            students.TryGetValue(chat.StudentId, out var student);
            lastMessages.TryGetValue(chat.StudentId, out var last);
            return new SupportConversationSummaryResponse(
                chat.StudentId,
                student?.FullName ?? "Unknown student",
                student?.Email ?? string.Empty,
                last is null ? string.Empty : Preview(last),
                last?.FromStudent ?? true,
                chat.LastMessageAt,
                chat.UnreadCount);
        }).ToList();
    }

    public async Task<SupportConversationResponse> GetConversationAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var student = await FindStudentAsync(studentId, cancellationToken);
        await MarkReadAsync(studentId, fromStudent: true, cancellationToken);

        var messages = await LoadMessagesAsync(studentId, cancellationToken);
        var adminIds = messages.Where(x => !x.FromStudent).Select(x => x.SenderId).Distinct().ToList();
        var adminNames = await dbContext.Users.AsNoTracking()
            .Where(x => adminIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.FullName, cancellationToken);
        var programs = await dbContext.Enrollments.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.Status != EnrollmentStatus.Cancelled && x.Program != null)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => x.Program!.Title)
            .ToListAsync(cancellationToken);

        return new SupportConversationResponse(
            student.Id,
            student.FullName,
            student.Email ?? string.Empty,
            student.PhoneNumber,
            programs.Distinct().ToList(),
            messages.Select(message => Map(message, message.FromStudent
                ? student.FullName
                : adminNames.GetValueOrDefault(message.SenderId, SupportTeamName))).ToList());
    }

    public async Task<SupportMessageResponse> SendAdminMessageAsync(
        Guid adminId,
        Guid studentId,
        SendSupportMessageRequest request,
        CancellationToken cancellationToken)
    {
        await FindStudentAsync(studentId, cancellationToken);
        var message = await CreateMessageAsync(studentId, adminId, fromStudent: false, request, cancellationToken);

        // One unread reminder is enough; don't stack a notification per message.
        var hasUnreadReminder = await dbContext.Notifications.AnyAsync(x =>
            x.UserId == studentId && x.ActionUrl == StudentSupportUrl && x.Status == NotificationStatus.Unread,
            cancellationToken);
        if (!hasUnreadReminder)
        {
            dbContext.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = studentId,
                Title = "New reply from Joviq Support",
                Body = Truncate(Preview(message), 300),
                ActionUrl = StudentSupportUrl
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        var adminName = await dbContext.Users.Where(x => x.Id == adminId).Select(x => x.FullName).FirstOrDefaultAsync(cancellationToken);
        return Map(message, adminName ?? SupportTeamName);
    }

    public async Task<SupportUnreadResponse> GetAdminUnreadAsync(CancellationToken cancellationToken)
    {
        var count = await dbContext.SupportMessages.CountAsync(x => x.FromStudent && x.ReadAt == null, cancellationToken);
        return new SupportUnreadResponse(count);
    }

    private async Task<SupportMessage> CreateMessageAsync(
        Guid studentId,
        Guid senderId,
        bool fromStudent,
        SendSupportMessageRequest request,
        CancellationToken cancellationToken)
    {
        var body = request.Body?.Trim() ?? string.Empty;
        if (body.Length > 2000)
        {
            throw Validation(nameof(request.Body), "Message must be 2000 characters or fewer.");
        }

        Asset? attachment = null;
        if (request.AttachmentAssetId is { } assetId)
        {
            attachment = await dbContext.Assets.AsNoTracking().FirstOrDefaultAsync(x => x.Id == assetId, cancellationToken);
            if (attachment is null || attachment.OwnerUserId != senderId || attachment.Status != AssetStatus.Ready ||
                attachment.Purpose != AssetPurpose.SupportAttachment)
            {
                throw Validation(nameof(request.AttachmentAssetId), "Attach a file you uploaded for this chat.");
            }
        }

        if (body.Length == 0 && attachment is null)
        {
            throw Validation(nameof(request.Body), "Type a message or attach a file.");
        }

        var message = new SupportMessage
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            SenderId = senderId,
            FromStudent = fromStudent,
            Body = body,
            AttachmentAssetId = attachment?.Id,
            AttachmentName = attachment?.OriginalFileName,
            AttachmentContentType = attachment?.ContentType,
            CreatedAt = clock.UtcNow
        };
        dbContext.SupportMessages.Add(message);
        return message;
    }

    private async Task<List<SupportMessage>> LoadMessagesAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var latest = await dbContext.SupportMessages.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(MaxMessagesPerChat)
            .ToListAsync(cancellationToken);
        latest.Reverse();
        return latest;
    }

    private async Task MarkReadAsync(Guid studentId, bool fromStudent, CancellationToken cancellationToken)
    {
        var unread = await dbContext.SupportMessages
            .Where(x => x.StudentId == studentId && x.FromStudent == fromStudent && x.ReadAt == null)
            .ToListAsync(cancellationToken);
        if (unread.Count == 0)
        {
            return;
        }

        var now = clock.UtcNow;
        foreach (var message in unread)
        {
            message.ReadAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<Identity.ApplicationUser> FindStudentAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var isStudent = await (
            from userRole in dbContext.UserRoles
            join role in dbContext.Roles on userRole.RoleId equals role.Id
            where userRole.UserId == studentId && role.Name == RoleNames.Student
            select userRole).AnyAsync(cancellationToken);
        var student = isStudent
            ? await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == studentId, cancellationToken)
            : null;
        return student ?? throw new AppException("Student was not found.", 404, "student_not_found");
    }

    private static SupportMessageResponse Map(SupportMessage message, string senderName) => new(
        message.Id,
        message.StudentId,
        message.FromStudent,
        senderName,
        message.Body,
        message.AttachmentAssetId,
        message.AttachmentName,
        message.AttachmentContentType,
        message.CreatedAt,
        message.ReadAt);

    private static string Preview(SupportMessage message) =>
        message.Body.Length > 0 ? Truncate(message.Body, 120) : $"📎 {message.AttachmentName ?? "Attachment"}";

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..(maxLength - 1)] + "…";

    private static ValidationAppException Validation(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });
}
