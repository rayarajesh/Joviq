using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Api.Controllers;

[Route("api/v1/auth")]
public sealed class AuthController(
    IAuthService authService,
    ICurrentUserService currentUser,
    IOptions<RefreshTokenOptions> refreshTokenOptions)
    : ApiControllerBase(currentUser)
{
    private readonly RefreshTokenOptions _refreshTokenOptions = refreshTokenOptions.Value;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<RegisterResponse>>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse<RegisterResponse>.Ok(result, "Registration successful. Please verify your email.", CorrelationId));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokenResponse>>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, RequestMetadata(request.DeviceName), cancellationToken);
        SetRefreshTokenCookieIfPresent(result);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(result, "Login successful.", CorrelationId));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokenResponse>>> Refresh(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(_refreshTokenOptions.CookieName, out var refreshToken);
        var result = await authService.RefreshAsync(refreshToken, RequestMetadata(), cancellationToken);
        SetRefreshTokenCookieIfPresent(result);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(result, "Token refreshed.", CorrelationId));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Logout(CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(RequiredUserId, CurrentSessionId, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        ClearRefreshTokenCookie();
        return Ok(ApiResponse.Ok("Logged out successfully.", CorrelationId));
    }

    [HttpPost("logout-all")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> LogoutAll(CancellationToken cancellationToken)
    {
        await authService.LogoutAllAsync(RequiredUserId, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        ClearRefreshTokenCookie();
        return Ok(ApiResponse.Ok("Logged out from all devices.", CorrelationId));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserSummaryResponse>>> Me(CancellationToken cancellationToken)
    {
        var result = await authService.GetMeAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<UserSummaryResponse>.Ok(result, "Current user loaded.", CorrelationId));
    }

    [HttpPost("email-verification/send")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> SendEmailVerification(EmailRequest request, CancellationToken cancellationToken)
    {
        await authService.SendEmailVerificationAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("If the account exists, a verification OTP has been sent.", CorrelationId));
    }

    [HttpPost("email-verification/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> VerifyEmail(VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        await authService.VerifyEmailAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("Email verified successfully.", CorrelationId));
    }

    [HttpPost("phone-otp/send")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> SendPhoneOtp(SendPhoneOtpRequest request, CancellationToken cancellationToken)
    {
        await authService.SendPhoneOtpAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("OTP sent successfully.", CorrelationId));
    }

    [HttpPost("phone-otp/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> VerifyPhoneOtp(VerifyPhoneOtpRequest request, CancellationToken cancellationToken)
    {
        await authService.VerifyPhoneOtpAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("OTP verified successfully.", CorrelationId));
    }

    [HttpPost("login/otp/request")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> RequestOtpLogin(RequestOtpLoginRequest request, CancellationToken cancellationToken)
    {
        await authService.RequestOtpLoginAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("If the account exists, an OTP has been sent.", CorrelationId));
    }

    [HttpPost("login/otp/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokenResponse>>> VerifyOtpLogin(VerifyOtpLoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.VerifyOtpLoginAsync(request, RequestMetadata(request.DeviceName), cancellationToken);
        SetRefreshTokenCookieIfPresent(result);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(result, "Login successful.", CorrelationId));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ForgotPasswordAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("If the account exists, password reset instructions have been sent.", CorrelationId));
    }

    [HttpPost("forgot-password/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PasswordResetVerificationResponse>>> VerifyForgotPassword(VerifyForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.VerifyForgotPasswordAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse<PasswordResetVerificationResponse>.Ok(result, "OTP verified.", CorrelationId));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ResetPasswordAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("Password reset successfully.", CorrelationId));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ChangePasswordAsync(RequiredUserId, request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse.Ok("Password changed successfully.", CorrelationId));
    }

    [HttpGet("sessions")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SessionResponse>>>> Sessions(CancellationToken cancellationToken)
    {
        var result = await authService.GetSessionsAsync(RequiredUserId, CurrentSessionId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<SessionResponse>>.Ok(result, "Sessions loaded.", CorrelationId));
    }

    [HttpDelete("sessions/{sessionId:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> RevokeSession(Guid sessionId, CancellationToken cancellationToken)
    {
        await authService.RevokeSessionAsync(RequiredUserId, sessionId, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(ApiResponse.Ok("Session revoked.", CorrelationId));
    }

    [HttpDelete("sessions")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> RevokeOtherSessions(CancellationToken cancellationToken)
    {
        await authService.RevokeOtherSessionsAsync(RequiredUserId, CurrentSessionId, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(ApiResponse.Ok("Other sessions revoked.", CorrelationId));
    }

    private void SetRefreshTokenCookieIfPresent(AuthTokenResponse result)
    {
        if (string.IsNullOrWhiteSpace(result.RefreshToken))
        {
            return;
        }

        Response.Cookies.Append(_refreshTokenOptions.CookieName, result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = result.RefreshTokenExpiresAt
        });
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(_refreshTokenOptions.CookieName, new CookieOptions
        {
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });
    }
}
