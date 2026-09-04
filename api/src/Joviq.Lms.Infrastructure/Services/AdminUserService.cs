using System.Net;
using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Application.Common.Validation;
using Joviq.Lms.Application.Users;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class AdminUserService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IEmailSender emailSender,
    IRefreshTokenService refreshTokenService,
    IAuditLogService auditLog) : IAdminUserService
{
    public async Task<PagedResult<AdminUserResponse>> GetUsersAsync(AdminUserListRequest request, CancellationToken cancellationToken)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize is <= 0 or > 100 ? 20 : request.PageSize;

        var query = dbContext.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(search) ||
                (x.Email != null && x.Email.ToLower().Contains(search)) ||
                (x.PhoneNumber != null && x.PhoneNumber.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var roleName = ResolveRoleName(request.Role);
            query = query.Where(user =>
                dbContext.UserRoles.Any(userRole =>
                    userRole.UserId == user.Id &&
                    dbContext.Roles.Any(role => role.Id == userRole.RoleId && role.Name == roleName)));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!Enum.TryParse<AccountStatus>(request.Status, ignoreCase: true, out var status))
            {
                throw new AppException("Invalid account status.", 400, "invalid_account_status");
            }

            query = query.Where(x => x.AccountStatus == status);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var users = await ApplyUserSort(query, request.SortBy, request.SortDirection)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = new List<AdminUserResponse>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            items.Add(ToResponse(user, roles));
        }

        return new PagedResult<AdminUserResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AdminUserSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var totalUsers = await dbContext.Users.CountAsync(cancellationToken);
        var active = await dbContext.Users.CountAsync(x => x.AccountStatus == AccountStatus.Active, cancellationToken);
        var locked = await dbContext.Users.CountAsync(x => x.AccountStatus == AccountStatus.Locked, cancellationToken);
        var pending = await dbContext.Users.CountAsync(x => x.AccountStatus == AccountStatus.PendingEmailVerification, cancellationToken);

        var roleCounts = await (
                from userRole in dbContext.UserRoles.AsNoTracking()
                join role in dbContext.Roles.AsNoTracking() on userRole.RoleId equals role.Id
                group userRole by role.Name into roleGroup
                select new { Role = roleGroup.Key ?? string.Empty, Count = roleGroup.Count() })
            .ToDictionaryAsync(x => x.Role, x => x.Count, cancellationToken);

        return new AdminUserSummaryResponse(
            totalUsers,
            roleCounts.GetValueOrDefault(RoleNames.Student),
            roleCounts.GetValueOrDefault(RoleNames.Admin),
            active,
            locked,
            pending);
    }

    public async Task<AdminUserResponse> GetUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        return ToResponse(user, await userManager.GetRolesAsync(user));
    }

    public async Task<AdminUserResponse> CreateUserAsync(CreateAdminUserRequest request, CancellationToken cancellationToken)
    {
        EnsureAssignableRoleAllowed(request.Role);

        var email = request.Email.Trim().ToLowerInvariant();
        if (await userManager.FindByEmailAsync(email) is not null)
        {
            throw new AppException("Email is already registered.", 409, "email_exists");
        }

        var phone = NormalizeIndianPhone(request.PhoneNumber);
        if (await dbContext.Users.AnyAsync(x => x.PhoneNumber == phone, cancellationToken))
        {
            throw new AppException("Phone number is already registered.", 409, "phone_exists");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            PhoneNumber = phone,
            AccountStatus = AccountStatus.Active,
            OnboardingStatus = request.Role == RoleNames.Student ? OnboardingStatus.NotStarted : OnboardingStatus.Completed
        };

        EnsureIdentitySucceeded(await userManager.CreateAsync(user, request.TemporaryPassword));
        EnsureIdentitySucceeded(await userManager.AddToRoleAsync(user, request.Role));

        if (request.Role == RoleNames.Student)
        {
            dbContext.StudentProfiles.Add(new Domain.Entities.StudentProfile { UserId = user.Id });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        auditLog.Add("Admin.User.Created", new { targetUserId = user.Id, request.Role }, user.Id, user.Email, user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(user, await userManager.GetRolesAsync(user));
    }

    public async Task<AdminUserResponse> UpdateUserAsync(
        Guid userId,
        UpdateAdminUserRequest request,
        CancellationToken cancellationToken)
    {
        EnsureAssignableRoleAllowed(request.Role);

        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var fullName = request.FullName.Trim();
        if (fullName.Length < 2)
        {
            throw new AppException("Full name must contain at least 2 characters.", 400, "invalid_full_name");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var normalizedEmail = userManager.NormalizeEmail(email);
        if (await dbContext.Users.AnyAsync(
                x => x.Id != user.Id && x.NormalizedEmail == normalizedEmail,
                cancellationToken))
        {
            throw new AppException("Email is already registered.", 409, "email_exists");
        }

        var phone = NormalizeIndianPhone(request.PhoneNumber);
        if (await dbContext.Users.AnyAsync(
                x => x.Id != user.Id && x.PhoneNumber == phone,
                cancellationToken))
        {
            throw new AppException("Phone number is already registered.", 409, "phone_exists");
        }

        if (!Enum.TryParse<AccountStatus>(request.AccountStatus, ignoreCase: true, out var status))
        {
            throw new AppException("Invalid account status.", 400, "invalid_account_status");
        }

        user.FullName = fullName;
        user.UserName = email;
        user.NormalizedUserName = userManager.NormalizeName(email);
        user.Email = email;
        user.NormalizedEmail = normalizedEmail;
        user.PhoneNumber = phone;

        if (status != user.AccountStatus)
        {
            await ApplyAccountStatusAsync(user, status, cancellationToken);
        }
        else if (status == AccountStatus.Active)
        {
            user.LockoutEnd = null;
        }

        EnsureIdentitySucceeded(await userManager.UpdateAsync(user));

        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Count != 1 || !currentRoles.Contains(request.Role))
        {
            EnsureIdentitySucceeded(await userManager.RemoveFromRolesAsync(user, currentRoles));
            EnsureIdentitySucceeded(await userManager.AddToRoleAsync(user, request.Role));
        }

        if (request.Role == RoleNames.Student &&
            !await dbContext.StudentProfiles.AnyAsync(x => x.UserId == user.Id, cancellationToken))
        {
            dbContext.StudentProfiles.Add(new Domain.Entities.StudentProfile { UserId = user.Id });
        }

        auditLog.Add(
            "Admin.User.Updated",
            new { targetUserId = user.Id, role = request.Role, status, email, phone },
            user.Id,
            user.Email,
            user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(user, await userManager.GetRolesAsync(user));
    }

    public async Task<AdminUserResponse> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        if (!Enum.TryParse<AccountStatus>(request.AccountStatus, ignoreCase: true, out var status))
        {
            throw new AppException("Invalid account status.", 400, "invalid_account_status");
        }

        await ApplyAccountStatusAsync(user, status, cancellationToken);

        EnsureIdentitySucceeded(await userManager.UpdateAsync(user));
        auditLog.Add("Admin.User.StatusUpdated", new { targetUserId = user.Id, status }, user.Id, user.Email, user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(user, await userManager.GetRolesAsync(user));
    }

    public async Task<AdminUserResponse> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        foreach (var role in request.Roles)
        {
            EnsureAssignableRoleAllowed(role);
        }

        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var currentRoles = await userManager.GetRolesAsync(user);
        EnsureIdentitySucceeded(await userManager.RemoveFromRolesAsync(user, currentRoles));
        EnsureIdentitySucceeded(await userManager.AddToRolesAsync(user, request.Roles));
        auditLog.Add("Admin.User.RolesUpdated", new { targetUserId = user.Id, previousRoles = currentRoles, nextRoles = request.Roles }, user.Id, user.Email, user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(user, await userManager.GetRolesAsync(user));
    }

    public async Task LockUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        user.AccountStatus = AccountStatus.Locked;
        user.LockoutEnd = DateTimeOffset.MaxValue;
        EnsureIdentitySucceeded(await userManager.UpdateAsync(user));
        await refreshTokenService.RevokeAllAsync(user.Id, null, "Account locked by admin.", cancellationToken);
        auditLog.Add("Admin.User.Locked", new { targetUserId = user.Id }, user.Id, user.Email, user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UnlockUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        user.AccountStatus = AccountStatus.Active;
        user.LockoutEnd = null;
        EnsureIdentitySucceeded(await userManager.UpdateAsync(user));
        auditLog.Add("Admin.User.Unlocked", new { targetUserId = user.Id }, user.Id, user.Email, user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SendPasswordResetLinkAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new AppException("User email is missing.", 400, "email_missing");
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        await emailSender.SendAsync(
            user.Email,
            "Reset your Joviq LMS password",
            $"Use this password reset token in the LMS reset-password screen: <strong>{WebUtility.HtmlEncode(token)}</strong>",
            cancellationToken);
        auditLog.Add("Admin.User.PasswordResetLinkSent", new { targetUserId = user.Id }, user.Id, user.Email, user.PhoneNumber);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SessionResponse>> GetSessionsAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.UserSessions
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(x => x.LastSeenAt ?? x.CreatedAt)
            .Select(x => new SessionResponse(
                x.Id,
                x.DeviceName,
                x.Browser,
                x.OperatingSystem,
                x.IpAddress,
                x.CreatedAt,
                x.LastSeenAt,
                x.ExpiresAt,
                false))
            .ToListAsync(cancellationToken);
    }

    public async Task RevokeSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken)
    {
        await refreshTokenService.RevokeSessionAsync(userId, sessionId, null, "Session revoked by admin.", cancellationToken);
        auditLog.Add("Admin.User.SessionRevoked", new { targetUserId = userId, sessionId }, userId);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task LogoutAllAsync(Guid userId, CancellationToken cancellationToken)
    {
        await refreshTokenService.RevokeAllAsync(userId, null, "All sessions revoked by admin.", cancellationToken);
        auditLog.Add("Admin.User.AllSessionsRevoked", new { targetUserId = userId }, userId);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static AdminUserResponse ToResponse(ApplicationUser user, IEnumerable<string> roles)
    {
        return new AdminUserResponse(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            user.PhoneNumber,
            user.ProfilePhotoUrl,
            user.EmailConfirmed,
            roles.ToList(),
            user.AccountStatus.ToString(),
            user.OnboardingStatus.ToString(),
            user.CreatedAt,
            user.LastLoginAt);
    }

    private async Task ApplyAccountStatusAsync(
        ApplicationUser user,
        AccountStatus status,
        CancellationToken cancellationToken)
    {
        user.AccountStatus = status;
        if (status is AccountStatus.Locked or AccountStatus.Deleted)
        {
            user.LockoutEnd = DateTimeOffset.MaxValue;
            await refreshTokenService.RevokeAllAsync(user.Id, null, $"Account status changed to {status}.", cancellationToken);
        }
        else if (status == AccountStatus.Active)
        {
            user.LockoutEnd = null;
        }
    }

    private static IQueryable<ApplicationUser> ApplyUserSort(
        IQueryable<ApplicationUser> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = string.Equals(sortDirection?.Trim(), "desc", StringComparison.OrdinalIgnoreCase);
        return sortBy?.Trim().ToLowerInvariant() switch
        {
            "name" or "fullname" => descending
                ? query.OrderByDescending(x => x.FullName).ThenBy(x => x.Id)
                : query.OrderBy(x => x.FullName).ThenBy(x => x.Id),
            "email" => descending
                ? query.OrderByDescending(x => x.Email).ThenBy(x => x.Id)
                : query.OrderBy(x => x.Email).ThenBy(x => x.Id),
            "status" or "accountstatus" => descending
                ? query.OrderByDescending(x => x.AccountStatus).ThenBy(x => x.FullName)
                : query.OrderBy(x => x.AccountStatus).ThenBy(x => x.FullName),
            "lastlogin" or "lastloginat" => descending
                ? query.OrderByDescending(x => x.LastLoginAt ?? DateTimeOffset.MinValue).ThenBy(x => x.FullName)
                : query.OrderBy(x => x.LastLoginAt ?? DateTimeOffset.MinValue).ThenBy(x => x.FullName),
            _ => descending
                ? query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.FullName)
                : query.OrderBy(x => x.CreatedAt).ThenBy(x => x.FullName)
        };
    }

    private static string ResolveRoleName(string role)
    {
        var resolvedRole = RoleNames.All.FirstOrDefault(
            candidate => string.Equals(candidate, role.Trim(), StringComparison.OrdinalIgnoreCase));

        if (resolvedRole is null)
        {
            throw new AppException("Only Admin and Student roles are allowed.", 400, "invalid_role");
        }

        return resolvedRole;
    }

    private static string NormalizeIndianPhone(string phone)
        => IndianMobileNumber.Normalize(phone)
            ?? throw new AppException("Mobile number must be a valid India +91 number with exactly 10 digits.", 400, "invalid_phone");

    private static void EnsureAssignableRoleAllowed(string role)
    {
        if (role is not RoleNames.Student)
        {
            throw new AppException("Only Student roles can be assigned here.", 400, "invalid_role");
        }
    }

    private static void EnsureIdentitySucceeded(IdentityResult result)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = result.Errors
            .GroupBy(error => error.Code)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());

        throw new ValidationAppException(errors);
    }
}
