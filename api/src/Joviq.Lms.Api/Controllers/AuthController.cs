using System.Security.Claims;
using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Api.Controllers;

[Route("api/v1/auth")]
public sealed class AuthController(
    IAuthService authService,
    ICurrentUserService currentUser,
    IOptions<RefreshTokenOptions> refreshTokenOptions,
    IOptions<ExternalAuthOptions> externalAuthOptions,
    IAuthenticationSchemeProvider authenticationSchemeProvider,
    IWebHostEnvironment hostEnvironment,
    ILogger<AuthController> logger)
    : ApiControllerBase(currentUser)
{
    private readonly RefreshTokenOptions _refreshTokenOptions = refreshTokenOptions.Value;
    private readonly ExternalAuthOptions _externalAuthOptions = externalAuthOptions.Value;
    private readonly bool _isDevelopment = hostEnvironment.IsDevelopment();

    [HttpGet("providers")]
    [AllowAnonymous]
    public async Task<IActionResult> Providers()
    {
        return Ok(ApiResponse<object>.Ok(new { google = await authenticationSchemeProvider.GetSchemeAsync("Google") is not null }, "Sign-in providers loaded.", CorrelationId));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthRegister")]
    public async Task<ActionResult<ApiResponse<RegisterResponse>>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, RequestMetadata(), cancellationToken);
        return Ok(ApiResponse<RegisterResponse>.Ok(result, result.VerificationEmailSent
            ? "Registration successful. Please verify your email."
            : "Account created, but the verification email could not be delivered. Please retry sending the OTP.", CorrelationId));
    }

    [HttpPost("checkout-account")]
    [AllowAnonymous]
    [EnableRateLimiting("CheckoutAccount")]
    public async Task<ActionResult<ApiResponse<AuthTokenResponse>>> CreateCheckoutAccount(CheckoutAccountRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.CreateCheckoutAccountAsync(request, RequestMetadata(), cancellationToken);
        SetRefreshTokenCookieIfPresent(result);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(result, "Checkout account created and signed in.", CorrelationId));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLogin")]
    public async Task<ActionResult<ApiResponse<AuthTokenResponse>>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, RequestMetadata(request.DeviceName), cancellationToken);
        SetRefreshTokenCookieIfPresent(result);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(result, "Login successful.", CorrelationId));
    }

    [HttpPost("resume-onboarding")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLogin")]
    public async Task<ActionResult<ApiResponse<AuthTokenResponse>>> ResumeOnboarding(ResumeOnboardingRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.ResumeOnboardingByEmailAsync(request, RequestMetadata(), cancellationToken);
        SetRefreshTokenCookieIfPresent(result);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(result, "Onboarding resumed.", CorrelationId));
    }

    [HttpGet("oauth/google/start")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLogin")]
    public async Task<IActionResult> StartGoogleOAuth(
        [FromQuery] string? returnUrl,
        [FromQuery] bool acceptedTerms,
        [FromQuery] bool allowSignUp,
        [FromQuery] bool rememberMe,
        [FromQuery] string? phoneNumber,
        [FromQuery] string? termsVersion,
        [FromQuery] string? privacyPolicyVersion,
        [FromQuery] string? deviceId,
        // Set only when starting from the onboarding (single-page) app: the paid-onboarding email.
        // It both pre-selects the Google account (login_hint) and is enforced in the callback so a
        // learner cannot link a different Google account to their paid enrollment.
        [FromQuery] string? email)
    {
        var normalizedReturnUrl = NormalizeReturnUrl(returnUrl);
        var expectedEmail = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        if (await authenticationSchemeProvider.GetSchemeAsync("Google") is null)
        {
            return Redirect(BuildCallbackUrl(expectedEmail, normalizedReturnUrl, "Google OAuth is not configured."));
        }

        var properties = new GoogleChallengeProperties
        {
            RedirectUri = Url.Action(nameof(CompleteGoogleOAuth))
        };

        if (expectedEmail is not null)
        {
            properties.LoginHint = expectedEmail;
            properties.Items["expectedEmail"] = expectedEmail;
        }

        properties.Items["returnUrl"] = normalizedReturnUrl;
        properties.Items["acceptedTerms"] = acceptedTerms ? "true" : "false";
        properties.Items["allowSignUp"] = allowSignUp ? "true" : "false";
        properties.Items["rememberMe"] = rememberMe ? "true" : "false";
        properties.Items["phoneNumber"] = phoneNumber;
        properties.Items["termsVersion"] = NormalizePolicyVersion(termsVersion);
        properties.Items["privacyPolicyVersion"] = NormalizePolicyVersion(privacyPolicyVersion);
        properties.Items["deviceId"] = deviceId;

        return Challenge(properties, "Google");
    }

    [HttpGet("oauth/google/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> CompleteGoogleOAuth(CancellationToken cancellationToken)
    {
        var authenticateResult = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
        var returnUrl = NormalizeReturnUrl(GetAuthenticationProperty(authenticateResult, "returnUrl"));
        var expectedEmail = GetAuthenticationProperty(authenticateResult, "expectedEmail");

        try
        {
            if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
            {
                return Redirect(BuildCallbackUrl(expectedEmail, returnUrl, "Google sign-in was cancelled or failed."));
            }

            var principal = authenticateResult.Principal;
            var providerKey = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
            var email = principal.FindFirstValue(ClaimTypes.Email);
            var fullName = principal.FindFirstValue(ClaimTypes.Name);
            var emailVerified = IsTruthy(principal.FindFirstValue("urn:google:email_verified")) ||
                IsTruthy(principal.FindFirstValue("email_verified"));

            if (string.IsNullOrWhiteSpace(providerKey) || string.IsNullOrWhiteSpace(email))
            {
                return Redirect(BuildCallbackUrl(expectedEmail, returnUrl, "Google did not return the required account details."));
            }

            // Onboarding started with a known paid email: the Google account must match it, otherwise
            // the sign-in would link a different account and strand the saved enrollment.
            if (!string.IsNullOrWhiteSpace(expectedEmail) &&
                !email.Trim().Equals(expectedEmail.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return Redirect(BuildCallbackUrl(expectedEmail, returnUrl,
                    $"Use the Google account for {expectedEmail} to continue your onboarding."));
            }

            var result = await authService.ExternalLoginAsync(
                new ExternalLoginRequest
                {
                    Provider = "Google",
                    ProviderKey = providerKey,
                    Email = email,
                    FullName = fullName,
                    EmailVerified = emailVerified,
                    RememberMe = IsTruthy(GetAuthenticationProperty(authenticateResult, "rememberMe")),
                    AllowSignUp = IsTruthy(GetAuthenticationProperty(authenticateResult, "allowSignUp")),
                    AcceptedTerms = IsTruthy(GetAuthenticationProperty(authenticateResult, "acceptedTerms")),
                    PhoneNumber = GetAuthenticationProperty(authenticateResult, "phoneNumber"),
                    TermsVersion = GetAuthenticationProperty(authenticateResult, "termsVersion"),
                    PrivacyPolicyVersion = GetAuthenticationProperty(authenticateResult, "privacyPolicyVersion"),
                    DeviceName = null
                },
                RequestMetadata(deviceId: GetAuthenticationProperty(authenticateResult, "deviceId")),
                cancellationToken);

            SetRefreshTokenCookieIfPresent(result);
            // Success always lands on the dashboard app, which restores the shared session cookie.
            return Redirect(BuildFrontendCallbackUrl(returnUrl));
        }
        catch (AppException exception)
        {
            logger.LogWarning(exception, "Google OAuth login failed with application error {ErrorCode}.", exception.ErrorCode);
            return Redirect(BuildCallbackUrl(expectedEmail, returnUrl, exception.Message));
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Google OAuth login failed.");
            return Redirect(BuildCallbackUrl(expectedEmail, returnUrl, "Google sign-in failed."));
        }
        finally
        {
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        }
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
            Secure = UseSecureRefreshCookie,
            SameSite = UseSecureRefreshCookie ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/",
            Expires = result.RefreshTokenExpiresAt
        });
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(_refreshTokenOptions.CookieName, new CookieOptions
        {
            Secure = UseSecureRefreshCookie,
            SameSite = UseSecureRefreshCookie ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        });
    }

    private bool UseSecureRefreshCookie => !_isDevelopment || Request.IsHttps;

    // Chooses where Google redirects back to. An onboarding-originated error (expectedEmail set)
    // returns to the onboarding app with the email prefilled; everything else goes to the dashboard
    // app's OAuth callback.
    private string BuildCallbackUrl(string? expectedEmail, string? returnUrl, string? error)
    {
        if (!string.IsNullOrWhiteSpace(expectedEmail) && !string.IsNullOrWhiteSpace(error))
        {
            var baseUrl = string.IsNullOrWhiteSpace(_externalAuthOptions.OnboardingCallbackUrl)
                ? "http://localhost:5174/onboarding"
                : _externalAuthOptions.OnboardingCallbackUrl.Trim();
            var separator = baseUrl.Contains('?') ? '&' : '?';
            return $"{baseUrl}{separator}email={Uri.EscapeDataString(expectedEmail.Trim())}&googleError={Uri.EscapeDataString(error)}";
        }

        return BuildFrontendCallbackUrl(returnUrl, error);
    }

    private string BuildFrontendCallbackUrl(string? returnUrl, string? error = null)
    {
        var callbackUrl = string.IsNullOrWhiteSpace(_externalAuthOptions.FrontendCallbackUrl)
            ? "http://localhost:5173/auth/google/callback"
            : _externalAuthOptions.FrontendCallbackUrl.Trim();

        var query = $"returnUrl={Uri.EscapeDataString(NormalizeReturnUrl(returnUrl))}";
        if (!string.IsNullOrWhiteSpace(error))
        {
            query += $"&error={Uri.EscapeDataString(error)}";
        }

        return $"{callbackUrl}{(callbackUrl.Contains('?') ? '&' : '?')}{query}";
    }

    private string NormalizePolicyVersion(string? version)
    {
        if (string.IsNullOrWhiteSpace(version))
        {
            return _externalAuthOptions.DefaultPolicyVersion;
        }

        var trimmed = version.Trim();
        return trimmed.Length <= 64 ? trimmed : trimmed[..64];
    }

    private static string NormalizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) ||
            !returnUrl.StartsWith('/') ||
            returnUrl.StartsWith("//") ||
            returnUrl.Contains('\r') ||
            returnUrl.Contains('\n'))
        {
            return "/dashboard";
        }

        return returnUrl;
    }

    private static string? GetAuthenticationProperty(AuthenticateResult authenticateResult, string key)
    {
        return authenticateResult.Properties?.Items.TryGetValue(key, out var value) == true ? value : null;
    }

    private static bool IsTruthy(string? value)
    {
        return value is not null &&
            (value.Equals("true", StringComparison.OrdinalIgnoreCase) ||
             value.Equals("1", StringComparison.OrdinalIgnoreCase));
    }
}
