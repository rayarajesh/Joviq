using System.Text.Json;
using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Application.Common.Validation;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService,
    IRefreshTokenService refreshTokenService,
    IOtpService otpService,
    IEmailSender emailSender,
    ISmsSender smsSender,
    IDateTimeProvider clock,
    IDataProtectionProvider dataProtectionProvider,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly IDataProtector _resetProtector = dataProtectionProvider.CreateProtector("joviq-lms-password-reset-v1");

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        if (!request.AcceptedTerms)
        {
            throw new AppException("Terms and policies must be accepted.", 400, "terms_required");
        }

        var email = NormalizeEmail(request.Email);
        var phone = NormalizeIndianPhone(request.PhoneNumber);

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            throw new AppException("Email is already registered.", 409, "email_exists");
        }

        if (await dbContext.Users.AnyAsync(x => x.PhoneNumber == phone, cancellationToken))
        {
            throw new AppException("Phone number is already registered.", 409, "phone_exists");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            UserName = email,
            Email = email,
            PhoneNumber = phone,
            AccountStatus = AccountStatus.PendingEmailVerification,
            OnboardingStatus = OnboardingStatus.NotStarted
        };

        EnsureIdentitySucceeded(await userManager.CreateAsync(user, request.Password));
        EnsureIdentitySucceeded(await userManager.AddToRoleAsync(user, RoleNames.Student));

        dbContext.UserConsents.Add(new UserConsent
        {
            UserId = user.Id,
            TermsVersion = request.TermsVersion,
            PrivacyPolicyVersion = request.PrivacyPolicyVersion,
            RefundPolicyVersion = request.RefundPolicyVersion,
            AcceptedAt = clock.UtcNow,
            IpAddress = metadata.IpAddress,
            UserAgent = metadata.UserAgent
        });

        dbContext.StudentProfiles.Add(new StudentProfile { UserId = user.Id });
        AddAudit(user.Id, "UserRegistered", user.Email, user.PhoneNumber, metadata);

        var code = await otpService.CreateOtpAsync(
            user.Id,
            email,
            OtpDestinationType.Email,
            OtpPurpose.EmailVerification,
            metadata.IpAddress,
            cancellationToken);

        AddAudit(user.Id, "EmailVerificationRequested", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        try
        {
            await emailSender.SendAsync(
                email,
                "Verify your Joviq LMS account",
                $"Your Joviq Technologies verification OTP is <strong>{code}</strong>. It expires soon.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to send registration verification email for user {UserId}.", user.Id);
        }

        return new RegisterResponse(user.Id, EmailVerificationRequired: true, PhoneVerificationRequired: false);
    }

    public async Task<AuthTokenResponse> LoginAsync(LoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            AddAudit(null, "LoginFailed", email, null, metadata, new { reason = "user_not_found" });
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid email or password.", 401, "invalid_credentials");
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            AddAudit(user.Id, "LoginFailed", user.Email, user.PhoneNumber, metadata, new { reason = "locked_out" });
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid email or password.", 401, "invalid_credentials");
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            EnsureIdentitySucceeded(await userManager.AccessFailedAsync(user));
            AddAudit(user.Id, "LoginFailed", user.Email, user.PhoneNumber, metadata, new { reason = "bad_password" });
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid email or password.", 401, "invalid_credentials");
        }

        EnsureIdentitySucceeded(await userManager.ResetAccessFailedCountAsync(user));
        EnsureCanLogin(user);

        user.LastLoginAt = clock.UtcNow;
        AddAudit(user.Id, "LoginSucceeded", user.Email, user.PhoneNumber, metadata);

        return await IssueTokenPairAsync(user, request.RememberMe, metadata with { DeviceName = request.DeviceName ?? metadata.DeviceName }, cancellationToken);
    }

    public async Task<AuthTokenResponse> ExternalLoginAsync(ExternalLoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var provider = NormalizeProvider(request.Provider);
        var providerKey = request.ProviderKey.Trim();
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(providerKey))
        {
            throw new AppException("OAuth provider user id is missing.", 400, "external_provider_key_missing");
        }

        if (!request.EmailVerified)
        {
            throw new AppException("OAuth provider did not verify the email address.", 403, "external_email_not_verified");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var user = await userManager.FindByLoginAsync(provider, providerKey);
        if (user is null)
        {
            user = await userManager.FindByEmailAsync(email);

            if (user is null)
            {
                if (!request.AllowSignUp)
                {
                    throw new AppException("No linked Google account was found. Please register first.", 401, "external_account_not_found");
                }

                if (!request.AcceptedTerms)
                {
                    throw new AppException("Terms and policies must be accepted.", 400, "terms_required");
                }

                var phone = NormalizeIndianPhone(request.PhoneNumber ?? string.Empty);
                if (await dbContext.Users.AnyAsync(x => x.PhoneNumber == phone, cancellationToken))
                {
                    throw new AppException("Phone number is already registered.", 409, "phone_exists");
                }

                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    FullName = BuildExternalFullName(request),
                    UserName = email,
                    Email = email,
                    PhoneNumber = phone,
                    EmailConfirmed = true,
                    AccountStatus = AccountStatus.Active,
                    OnboardingStatus = OnboardingStatus.NotStarted
                };

                EnsureIdentitySucceeded(await userManager.CreateAsync(user));
                EnsureIdentitySucceeded(await userManager.AddToRoleAsync(user, RoleNames.Student));

                dbContext.UserConsents.Add(new UserConsent
                {
                    UserId = user.Id,
                    TermsVersion = NormalizePolicyVersion(request.TermsVersion),
                    PrivacyPolicyVersion = NormalizePolicyVersion(request.PrivacyPolicyVersion),
                    RefundPolicyVersion = NormalizePolicyVersion(request.RefundPolicyVersion),
                    AcceptedAt = clock.UtcNow,
                    IpAddress = metadata.IpAddress,
                    UserAgent = metadata.UserAgent
                });

                dbContext.StudentProfiles.Add(new StudentProfile { UserId = user.Id });
                AddAudit(user.Id, "UserRegistered", user.Email, user.PhoneNumber, metadata, new { method = "oauth", provider });
            }
            else if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                if (user.AccountStatus == AccountStatus.PendingEmailVerification)
                {
                    user.AccountStatus = AccountStatus.Active;
                }

                AddAudit(user.Id, "EmailVerified", user.Email, user.PhoneNumber, metadata, new { method = "oauth", provider });
            }

            EnsureIdentitySucceeded(await userManager.AddLoginAsync(user, new UserLoginInfo(provider, providerKey, provider)));
            AddAudit(user.Id, "ExternalLoginLinked", user.Email, user.PhoneNumber, metadata, new { provider });
        }

        EnsureCanLogin(user);

        user.LastLoginAt = clock.UtcNow;
        AddAudit(user.Id, "LoginSucceeded", user.Email, user.PhoneNumber, metadata, new { method = "oauth", provider });

        var result = await IssueTokenPairAsync(
            user,
            request.RememberMe,
            metadata with { DeviceName = request.DeviceName ?? metadata.DeviceName ?? $"{provider} OAuth" },
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    public async Task<AuthTokenResponse> RefreshAsync(string? refreshToken, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new AppException("Refresh token is missing.", 401, "refresh_token_missing");
        }

        var jwtId = Guid.NewGuid().ToString("N");
        var (session, rawRefreshToken) = await refreshTokenService.RotateAsync(refreshToken, jwtId, metadata, cancellationToken);
        var user = await userManager.FindByIdAsync(session.UserId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        EnsureCanLogin(user, requireEmailConfirmed: false);

        var (accessToken, expiresIn) = await jwtTokenService.CreateAccessTokenAsync(user.Id, session.Id, jwtId, cancellationToken);
        AddAudit(user.Id, "RefreshTokenRotated", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new AuthTokenResponse
        {
            AccessToken = accessToken,
            ExpiresIn = expiresIn,
            RefreshToken = rawRefreshToken,
            RefreshTokenExpiresAt = session.ExpiresAt,
            User = await BuildUserSummaryAsync(user)
        };
    }

    public Task LogoutAsync(Guid userId, Guid? sessionId, string? ipAddress, CancellationToken cancellationToken)
    {
        if (sessionId is null)
        {
            return Task.CompletedTask;
        }

        return refreshTokenService.RevokeSessionAsync(userId, sessionId.Value, ipAddress, "User logout.", cancellationToken);
    }

    public Task LogoutAllAsync(Guid userId, string? ipAddress, CancellationToken cancellationToken)
    {
        return refreshTokenService.RevokeAllAsync(userId, ipAddress, "User logout all devices.", cancellationToken);
    }

    public async Task<UserSummaryResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        return await BuildUserSummaryAsync(user);
    }

    public async Task SendEmailVerificationAsync(EmailRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await userManager.FindByEmailAsync(email);
        if (user is null || user.EmailConfirmed)
        {
            return;
        }

        var code = await otpService.CreateOtpAsync(user.Id, email, OtpDestinationType.Email, OtpPurpose.EmailVerification, metadata.IpAddress, cancellationToken);
        await emailSender.SendAsync(email, "Verify your Joviq LMS account", $"Your verification OTP is <strong>{code}</strong>.", cancellationToken);
        AddAudit(user.Id, "EmailVerificationRequested", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task VerifyEmailAsync(VerifyEmailRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new AppException("Invalid verification request.", 400, "invalid_verification");

        await otpService.VerifyOtpAsync(email, OtpPurpose.EmailVerification, request.Otp, cancellationToken);

        user.EmailConfirmed = true;
        if (user.AccountStatus == AccountStatus.PendingEmailVerification)
        {
            user.AccountStatus = AccountStatus.Active;
        }

        AddAudit(user.Id, "EmailVerified", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SendPhoneOtpAsync(SendPhoneOtpRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var phone = NormalizeIndianPhone(request.PhoneNumber);
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.PhoneNumber == phone, cancellationToken);
        var code = await otpService.CreateOtpAsync(user?.Id, phone, OtpDestinationType.Phone, request.Purpose, metadata.IpAddress, cancellationToken);
        await smsSender.SendAsync(phone, $"Your Joviq Technologies OTP is {code}.", cancellationToken);
        AddAudit(user?.Id, "PhoneOtpRequested", user?.Email, phone, metadata, new { request.Purpose });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task VerifyPhoneOtpAsync(VerifyPhoneOtpRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var phone = NormalizeIndianPhone(request.PhoneNumber);
        await otpService.VerifyOtpAsync(phone, request.Purpose, request.Otp, cancellationToken);

        if (request.Purpose == OtpPurpose.PhoneVerification)
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(x => x.PhoneNumber == phone, cancellationToken)
                ?? throw new AppException("User was not found.", 404, "user_not_found");

            user.PhoneNumberConfirmed = true;
            AddAudit(user.Id, "PhoneVerified", user.Email, user.PhoneNumber, metadata);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task RequestOtpLoginAsync(RequestOtpLoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var phone = NormalizeIndianPhone(request.PhoneNumber);
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.PhoneNumber == phone, cancellationToken);
        if (user is not null)
        {
            var code = await otpService.CreateOtpAsync(user.Id, phone, OtpDestinationType.Phone, OtpPurpose.Login, metadata.IpAddress, cancellationToken);
            await smsSender.SendAsync(phone, $"Your Joviq LMS login OTP is {code}.", cancellationToken);
            AddAudit(user.Id, "PhoneOtpRequested", user.Email, user.PhoneNumber, metadata, new { purpose = "Login" });
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<AuthTokenResponse> VerifyOtpLoginAsync(VerifyOtpLoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var phone = NormalizeIndianPhone(request.PhoneNumber);
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.PhoneNumber == phone, cancellationToken)
            ?? throw new AppException("Invalid OTP login request.", 401, "invalid_otp_login");

        EnsureCanLogin(user, requireEmailConfirmed: false);
        await otpService.VerifyOtpAsync(phone, OtpPurpose.Login, request.Otp, cancellationToken);
        user.PhoneNumberConfirmed = true;
        user.LastLoginAt = clock.UtcNow;
        AddAudit(user.Id, "LoginSucceeded", user.Email, user.PhoneNumber, metadata, new { method = "otp" });

        return await IssueTokenPairAsync(user, request.RememberMe, metadata with { DeviceName = request.DeviceName ?? metadata.DeviceName }, cancellationToken);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var (user, destinationType, destination) = await FindUserByEmailOrPhoneAsync(request.EmailOrPhone, cancellationToken);
        if (user is null)
        {
            return;
        }

        var code = await otpService.CreateOtpAsync(user.Id, destination, destinationType, OtpPurpose.ForgotPassword, metadata.IpAddress, cancellationToken);

        if (destinationType == OtpDestinationType.Email)
        {
            await emailSender.SendAsync(destination, "Reset your Joviq LMS password", $"Your password reset OTP is <strong>{code}</strong>.", cancellationToken);
        }
        else
        {
            await smsSender.SendAsync(destination, $"Your Joviq LMS password reset OTP is {code}.", cancellationToken);
        }

        AddAudit(user.Id, "ForgotPasswordRequested", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<PasswordResetVerificationResponse> VerifyForgotPasswordAsync(VerifyForgotPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var (user, _, destination) = await FindUserByEmailOrPhoneAsync(request.EmailOrPhone, cancellationToken);
        if (user is null)
        {
            throw new AppException("Invalid password reset request.", 400, "invalid_password_reset");
        }

        await otpService.VerifyOtpAsync(destination, OtpPurpose.ForgotPassword, request.Otp, cancellationToken);
        var identityToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var protectedToken = _resetProtector.Protect(JsonSerializer.Serialize(new ResetTokenPayload(user.Id, identityToken, clock.UtcNow.AddMinutes(10))));

        return new PasswordResetVerificationResponse(user.Id, protectedToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString())
            ?? throw new AppException("Invalid password reset request.", 400, "invalid_password_reset");

        var payload = ReadResetTokenPayload(request.ResetToken);
        if (payload.UserId != user.Id || payload.ExpiresAt <= clock.UtcNow)
        {
            throw new AppException("Password reset token expired.", 400, "reset_token_expired");
        }

        EnsureIdentitySucceeded(await userManager.ResetPasswordAsync(user, payload.IdentityToken, request.NewPassword));
        await userManager.UpdateSecurityStampAsync(user);
        await refreshTokenService.RevokeAllAsync(user.Id, metadata.IpAddress, "Password reset.", cancellationToken);
        AddAudit(user.Id, "PasswordResetSucceeded", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        EnsureIdentitySucceeded(await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword));
        await userManager.UpdateSecurityStampAsync(user);
        await refreshTokenService.RevokeAllExceptAsync(user.Id, null, metadata.IpAddress, "Password changed.", cancellationToken);
        AddAudit(user.Id, "PasswordChanged", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SessionResponse>> GetSessionsAsync(Guid userId, Guid? currentSessionId, CancellationToken cancellationToken)
    {
        return await dbContext.UserSessions
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > clock.UtcNow)
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
                x.Id == currentSessionId))
            .ToListAsync(cancellationToken);
    }

    public Task RevokeSessionAsync(Guid userId, Guid sessionId, string? ipAddress, CancellationToken cancellationToken)
    {
        return refreshTokenService.RevokeSessionAsync(userId, sessionId, ipAddress, "Session revoked by user.", cancellationToken);
    }

    public Task RevokeOtherSessionsAsync(Guid userId, Guid? currentSessionId, string? ipAddress, CancellationToken cancellationToken)
    {
        return refreshTokenService.RevokeAllExceptAsync(userId, currentSessionId, ipAddress, "Other sessions revoked by user.", cancellationToken);
    }

    public async Task RequestAccountDeletionAsync(Guid userId, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var destination = user.Email ?? throw new AppException("User email is missing.", 400, "email_missing");
        var code = await otpService.CreateOtpAsync(user.Id, destination, OtpDestinationType.Email, OtpPurpose.DeleteAccount, metadata.IpAddress, cancellationToken);
        await emailSender.SendAsync(destination, "Confirm Joviq LMS account deletion", $"Your account deletion OTP is <strong>{code}</strong>.", cancellationToken);
        AddAudit(user.Id, "DeleteAccountRequested", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ConfirmAccountDeletionAsync(Guid userId, ConfirmAccountDeletionRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var destination = user.Email ?? throw new AppException("User email is missing.", 400, "email_missing");
        await otpService.VerifyOtpAsync(destination, OtpPurpose.DeleteAccount, request.Otp, cancellationToken);

        user.AccountStatus = AccountStatus.Deleted;
        user.LockoutEnd = DateTimeOffset.MaxValue;
        await refreshTokenService.RevokeAllAsync(user.Id, metadata.IpAddress, "Account deleted.", cancellationToken);
        AddAudit(user.Id, "AccountDeleted", user.Email, user.PhoneNumber, metadata, new { request.Reason });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthTokenResponse> IssueTokenPairAsync(
        ApplicationUser user,
        bool rememberMe,
        RequestMetadata metadata,
        CancellationToken cancellationToken)
    {
        var jwtId = Guid.NewGuid().ToString("N");
        var (session, rawRefreshToken) = await refreshTokenService.CreateSessionAsync(user.Id, jwtId, rememberMe, metadata, cancellationToken);
        var (accessToken, expiresIn) = await jwtTokenService.CreateAccessTokenAsync(user.Id, session.Id, jwtId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new AuthTokenResponse
        {
            AccessToken = accessToken,
            ExpiresIn = expiresIn,
            RefreshToken = rawRefreshToken,
            RefreshTokenExpiresAt = session.ExpiresAt,
            User = await BuildUserSummaryAsync(user)
        };
    }

    private async Task<UserSummaryResponse> BuildUserSummaryAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new UserSummaryResponse(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            user.EmailConfirmed,
            user.PhoneNumber,
            user.ProfilePhotoUrl,
            user.PhoneNumberConfirmed,
            roles.ToList(),
            user.AccountStatus.ToString(),
            user.OnboardingStatus.ToString());
    }

    private void EnsureCanLogin(ApplicationUser user, bool requireEmailConfirmed = true)
    {
        if (user.AccountStatus == AccountStatus.Deleted)
        {
            throw new AppException("Account is deleted.", 403, "account_deleted");
        }

        if (user.AccountStatus == AccountStatus.Locked || user.LockoutEnd > clock.UtcNow)
        {
            throw new AppException("Account is locked.", 403, "account_locked");
        }

        if (requireEmailConfirmed && !user.EmailConfirmed)
        {
            throw new AppException("Please verify your email before login.", 403, "email_not_verified");
        }
    }

    private void AddAudit(Guid? userId, string eventType, string? email, string? phone, RequestMetadata? metadata, object? extra = null)
    {
        dbContext.AuthAuditLogs.Add(new AuthAuditLog
        {
            UserId = userId,
            EventType = eventType,
            Email = email,
            Phone = phone,
            IpAddress = metadata?.IpAddress,
            UserAgent = metadata?.UserAgent,
            MetadataJson = extra is null ? null : JsonSerializer.Serialize(extra)
        });
    }

    private async Task<(ApplicationUser? User, OtpDestinationType DestinationType, string Destination)> FindUserByEmailOrPhoneAsync(
        string emailOrPhone,
        CancellationToken cancellationToken)
    {
        if (emailOrPhone.Contains('@'))
        {
            var email = NormalizeEmail(emailOrPhone);
            return (await userManager.FindByEmailAsync(email), OtpDestinationType.Email, email);
        }

        var phone = NormalizeIndianPhone(emailOrPhone);
        return (await dbContext.Users.FirstOrDefaultAsync(x => x.PhoneNumber == phone, cancellationToken), OtpDestinationType.Phone, phone);
    }

    private ResetTokenPayload ReadResetTokenPayload(string token)
    {
        try
        {
            var json = _resetProtector.Unprotect(token);
            return JsonSerializer.Deserialize<ResetTokenPayload>(json)
                ?? throw new AppException("Invalid password reset token.", 400, "invalid_reset_token");
        }
        catch (AppException)
        {
            throw;
        }
        catch
        {
            throw new AppException("Invalid password reset token.", 400, "invalid_reset_token");
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

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string NormalizeProvider(string provider)
    {
        if (provider.Equals("Google", StringComparison.OrdinalIgnoreCase))
        {
            return "Google";
        }

        throw new AppException("Unsupported OAuth provider.", 400, "unsupported_oauth_provider");
    }

    private static string BuildExternalFullName(ExternalLoginRequest request)
    {
        var fullName = request.FullName?.Trim();
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return Truncate(fullName, 160);
        }

        var emailName = request.Email.Split('@', 2)[0]
            .Replace('.', ' ')
            .Replace('_', ' ')
            .Replace('-', ' ')
            .Trim();

        return string.IsNullOrWhiteSpace(emailName) ? "Joviq Learner" : Truncate(emailName, 160);
    }

    private static string NormalizePolicyVersion(string? version)
    {
        return string.IsNullOrWhiteSpace(version) ? "oauth" : Truncate(version.Trim(), 64);
    }

    private static string Truncate(string value, int maxLength)
    {
        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private static string NormalizeIndianPhone(string phone)
    {
        return IndianMobileNumber.Normalize(phone)
            ?? throw new AppException("Mobile number must be a valid India +91 number with exactly 10 digits.", 400, "invalid_phone");
    }

    private sealed record ResetTokenPayload(Guid UserId, string IdentityToken, DateTimeOffset ExpiresAt);
}
