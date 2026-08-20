using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/v1/admin/users")]
public sealed class AdminUsersController(
    IAdminUserService adminUserService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserResponse>>>> GetUsers(
        [FromQuery] AdminUserListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await adminUserService.GetUsersAsync(request, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminUserResponse>>.Ok(result, "Users loaded.", CorrelationId));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<AdminUserSummaryResponse>>> GetSummary(CancellationToken cancellationToken)
    {
        var result = await adminUserService.GetSummaryAsync(cancellationToken);
        return Ok(ApiResponse<AdminUserSummaryResponse>.Ok(result, "User summary loaded.", CorrelationId));
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<ApiResponse<AdminUserResponse>>> GetUser(Guid userId, CancellationToken cancellationToken)
    {
        var result = await adminUserService.GetUserAsync(userId, cancellationToken);
        return Ok(ApiResponse<AdminUserResponse>.Ok(result, "User loaded.", CorrelationId));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AdminUserResponse>>> CreateUser(CreateAdminUserRequest request, CancellationToken cancellationToken)
    {
        var result = await adminUserService.CreateUserAsync(request, cancellationToken);
        return Ok(ApiResponse<AdminUserResponse>.Ok(result, "User created.", CorrelationId));
    }

    [HttpPatch("{userId:guid}/status")]
    public async Task<ActionResult<ApiResponse<AdminUserResponse>>> UpdateStatus(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await adminUserService.UpdateStatusAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<AdminUserResponse>.Ok(result, "User status updated.", CorrelationId));
    }

    [HttpPatch("{userId:guid}/roles")]
    public async Task<ActionResult<ApiResponse<AdminUserResponse>>> UpdateRoles(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        var result = await adminUserService.UpdateRolesAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<AdminUserResponse>.Ok(result, "User roles updated.", CorrelationId));
    }

    [HttpPost("{userId:guid}/lock")]
    public async Task<ActionResult<ApiResponse>> Lock(Guid userId, CancellationToken cancellationToken)
    {
        await adminUserService.LockUserAsync(userId, cancellationToken);
        return Ok(ApiResponse.Ok("User locked.", CorrelationId));
    }

    [HttpPost("{userId:guid}/unlock")]
    public async Task<ActionResult<ApiResponse>> Unlock(Guid userId, CancellationToken cancellationToken)
    {
        await adminUserService.UnlockUserAsync(userId, cancellationToken);
        return Ok(ApiResponse.Ok("User unlocked.", CorrelationId));
    }

    [HttpPost("{userId:guid}/reset-password-link")]
    public async Task<ActionResult<ApiResponse>> SendResetPasswordLink(Guid userId, CancellationToken cancellationToken)
    {
        await adminUserService.SendPasswordResetLinkAsync(userId, cancellationToken);
        return Ok(ApiResponse.Ok("Password reset link generated.", CorrelationId));
    }

    [HttpGet("{userId:guid}/sessions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<Joviq.Lms.Application.Auth.SessionResponse>>>> GetSessions(Guid userId, CancellationToken cancellationToken)
    {
        var result = await adminUserService.GetSessionsAsync(userId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<Joviq.Lms.Application.Auth.SessionResponse>>.Ok(result, "User sessions loaded.", CorrelationId));
    }

    [HttpDelete("{userId:guid}/sessions/{sessionId:guid}")]
    public async Task<ActionResult<ApiResponse>> RevokeSession(Guid userId, Guid sessionId, CancellationToken cancellationToken)
    {
        await adminUserService.RevokeSessionAsync(userId, sessionId, cancellationToken);
        return Ok(ApiResponse.Ok("Session revoked.", CorrelationId));
    }

    [HttpPost("{userId:guid}/logout-all")]
    public async Task<ActionResult<ApiResponse>> LogoutAll(Guid userId, CancellationToken cancellationToken)
    {
        await adminUserService.LogoutAllAsync(userId, cancellationToken);
        return Ok(ApiResponse.Ok("All user sessions revoked.", CorrelationId));
    }
}
