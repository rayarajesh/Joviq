using System.Text.Json;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class AuditLogService(
    ApplicationDbContext dbContext,
    ICurrentUserService currentUser,
    IDateTimeProvider clock) : IAuditLogService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public void Add(string eventType, object? metadata = null, Guid? userId = null, string? email = null, string? phone = null)
    {
        dbContext.AuthAuditLogs.Add(new AuthAuditLog
        {
            UserId = userId ?? currentUser.UserId,
            EventType = eventType.Trim(),
            Email = email,
            Phone = phone,
            MetadataJson = metadata is null
                ? null
                : JsonSerializer.Serialize(new
                {
                    actorUserId = currentUser.UserId,
                    actorSessionId = currentUser.SessionId,
                    actorRoles = currentUser.Roles,
                    data = metadata
                }, JsonOptions)
        });
    }

    public async Task<PagedResult<AuditLogResponse>> GetAuditLogsAsync(
        AuditLogListRequest request,
        CancellationToken cancellationToken)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize is <= 0 or > 100 ? 20 : request.PageSize;
        var query = dbContext.AuthAuditLogs.AsNoTracking().AsQueryable();

        if (request.UserId.HasValue)
        {
            query = query.Where(x => x.UserId == request.UserId);
        }

        if (!string.IsNullOrWhiteSpace(request.EventType))
        {
            var eventType = request.EventType.Trim().ToLowerInvariant();
            query = query.Where(x => x.EventType.ToLower().Contains(eventType));
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.EventType.ToLower().Contains(search) ||
                (x.Email != null && x.Email.ToLower().Contains(search)) ||
                (x.Phone != null && x.Phone.Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AuditLogResponse(
                x.Id,
                x.UserId,
                x.EventType,
                x.Email,
                x.Phone,
                x.IpAddress,
                x.UserAgent,
                x.MetadataJson,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<AuditLogResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public Task<int> PurgeExpiredAsync(int retentionDays, CancellationToken cancellationToken)
    {
        var cutoff = clock.UtcNow.AddDays(-Math.Max(retentionDays, 1));
        return dbContext.AuthAuditLogs
            .Where(x => x.CreatedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
