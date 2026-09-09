using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize]
[Route("api/v1/account")]
public sealed class AccountController(
    IAuthService authService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<AccountProfileResponse>>> GetProfile(CancellationToken cancellationToken)
    {
        var result = await authService.GetProfileAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<AccountProfileResponse>.Ok(result, "Profile loaded.", CorrelationId));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<AccountProfileResponse>>> UpdateProfile(
        UpdateAccountProfileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.UpdateProfileAsync(RequiredUserId, request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse<AccountProfileResponse>.Ok(result, "Profile saved.", CorrelationId));
    }

    [HttpPost("delete/request")]
    public async Task<ActionResult<ApiResponse>> RequestDelete(CancellationToken cancellationToken)
    {
        await authService.RequestAccountDeletionAsync(RequiredUserId, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("Account deletion OTP sent.", CorrelationId));
    }

    [HttpPost("delete/confirm")]
    public async Task<ActionResult<ApiResponse>> ConfirmDelete(ConfirmAccountDeletionRequest request, CancellationToken cancellationToken)
    {
        await authService.ConfirmAccountDeletionAsync(RequiredUserId, request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("Account deleted successfully.", CorrelationId));
    }
}
