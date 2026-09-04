using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Models;

namespace Joviq.Lms.Application.Users;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserResponse>> GetUsersAsync(AdminUserListRequest request, CancellationToken cancellationToken);

    Task<AdminUserSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken);

    Task<AdminUserResponse> GetUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<AdminUserResponse> CreateUserAsync(CreateAdminUserRequest request, CancellationToken cancellationToken);

    Task<AdminUserResponse> UpdateUserAsync(Guid userId, UpdateAdminUserRequest request, CancellationToken cancellationToken);

    Task<AdminUserResponse> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken);

    Task<AdminUserResponse> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken);

    Task LockUserAsync(Guid userId, CancellationToken cancellationToken);

    Task UnlockUserAsync(Guid userId, CancellationToken cancellationToken);

    Task SendPasswordResetLinkAsync(Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<SessionResponse>> GetSessionsAsync(Guid userId, CancellationToken cancellationToken);

    Task RevokeSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken);

    Task LogoutAllAsync(Guid userId, CancellationToken cancellationToken);
}
