using System.Globalization;
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

        var verificationEmailSent = false;
        try
        {
            await emailSender.SendAsync(
                email,
                "Verify your Joviq LMS account",
                $"Your Joviq Technologies verification OTP is <strong>{code}</strong>. It expires soon.",
                cancellationToken);
            verificationEmailSent = true;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to send registration verification email for user {UserId}.", user.Id);
        }

        return new RegisterResponse(user.Id, EmailVerificationRequired: true, VerificationEmailSent: verificationEmailSent);
    }

    public async Task<AuthTokenResponse> CreateCheckoutAccountAsync(
        CheckoutAccountRequest request,
        RequestMetadata metadata,
        CancellationToken cancellationToken)
    {
        if (!request.AcceptedTerms)
        {
            throw new AppException("Terms and policies must be accepted.", 400, "terms_required");
        }

        var email = NormalizeEmail(request.Email);
        var phone = NormalizeIndianPhone(request.PhoneNumber);

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            throw new AppException("This email already has an account. Sign out and use a new email for this enrollment.", 409, "email_exists");
        }

        if (await dbContext.Users.AnyAsync(x => x.PhoneNumber == phone, cancellationToken))
        {
            throw new AppException("This phone number already has an account. Use the same account for this enrollment.", 409, "phone_exists");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            UserName = email,
            Email = email,
            PhoneNumber = phone,
            EmailConfirmed = false,
            AccountStatus = AccountStatus.PendingEmailVerification,
            OnboardingStatus = OnboardingStatus.NotStarted
        };

        // The checkout account is authenticated with the short-lived checkout session.
        // The user can set a password later through the normal forgot-password flow.
        EnsureIdentitySucceeded(await userManager.CreateAsync(user));
        EnsureIdentitySucceeded(await userManager.AddToRoleAsync(user, RoleNames.Student));

        dbContext.UserConsents.Add(new UserConsent
        {
            UserId = user.Id,
            TermsVersion = request.TermsVersion,
            PrivacyPolicyVersion = request.PrivacyPolicyVersion,
            AcceptedAt = clock.UtcNow,
            IpAddress = metadata.IpAddress,
            UserAgent = metadata.UserAgent
        });

        dbContext.StudentProfiles.Add(new StudentProfile
        {
            UserId = user.Id,
            College = request.CollegeName.Trim()
        });
        AddAudit(user.Id, "CheckoutAccountCreated", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return await IssueTokenPairAsync(user, rememberMe: true, metadata, cancellationToken);
    }

    public async Task<AuthTokenResponse> LoginAsync(LoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        logger.LogInformation("LoginAsync called with email: {Email}, password length: {PasswordLength}", email, request.Password?.Length ?? 0);
        
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            logger.LogError("User not found for email: {Email}", email);
            AddAudit(null, "LoginFailed", email, null, metadata, new { reason = "user_not_found" });
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid email or password.", 401, "invalid_credentials");
        }

        logger.LogInformation("User found: {UserId}, Email: {Email}", user.Id, user.Email);

        if (await userManager.IsLockedOutAsync(user))
        {
            logger.LogError("User is locked out: {Email}", email);
            AddAudit(user.Id, "LoginFailed", user.Email, user.PhoneNumber, metadata, new { reason = "locked_out" });
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid email or password.", 401, "invalid_credentials");
        }

        var passwordOk = await userManager.CheckPasswordAsync(user, request.Password);
        logger.LogInformation("Password check result for {Email}: {Result}", email, passwordOk);
        
        if (!passwordOk)
        {
            logger.LogError("Password check failed for email: {Email}", email);
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
            metadata with { DeviceName = request.DeviceName ?? metadata.DeviceName },
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

    public async Task<AccountProfileResponse> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        return await BuildAccountProfileAsync(user);
    }

    public async Task<AccountProfileResponse> UpdateProfileAsync(
        Guid userId,
        UpdateAccountProfileRequest request,
        RequestMetadata metadata,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var fullName = request.FullName.Trim();
        if (fullName.Length < 2)
        {
            throw new AppException("Full name must contain at least 2 characters.", 400, "invalid_full_name");
        }

        var phoneNumber = IndianMobileNumber.Normalize(request.PhoneNumber);
        if (phoneNumber is not null && await dbContext.Users.AnyAsync(
                x => x.Id != user.Id && x.PhoneNumber == phoneNumber,
                cancellationToken))
        {
            throw new AppException("Phone number is already registered.", 409, "phone_exists");
        }

        user.FullName = fullName;
        user.PhoneNumber = phoneNumber;
        user.DateOfBirth = ParseProfileDateOfBirth(request.DateOfBirth);
        user.Address = NormalizeOptionalProfileText(request.Address, nameof(request.Address), 3, 500);
        user.City = NormalizeOptionalProfileText(request.City, nameof(request.City), 2, 120);
        user.State = NormalizeOptionalProfileText(request.State, nameof(request.State), 2, 120);

        EnsureIdentitySucceeded(await userManager.UpdateAsync(user));
        AddAudit(user.Id, "ProfileUpdated", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await BuildAccountProfileAsync(user);
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

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return;
        }

        var code = await otpService.CreateOtpAsync(user.Id, email, OtpDestinationType.Email, OtpPurpose.ForgotPassword, metadata.IpAddress, cancellationToken);
        await emailSender.SendAsync(email, "Reset your Joviq LMS password", $"Your password reset OTP is <strong>{code}</strong>.", cancellationToken);

        AddAudit(user.Id, "ForgotPasswordRequested", user.Email, user.PhoneNumber, metadata);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<PasswordResetVerificationResponse> VerifyForgotPasswordAsync(VerifyForgotPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            throw new AppException("Invalid password reset request.", 400, "invalid_password_reset");
        }

        await otpService.VerifyOtpAsync(email, OtpPurpose.ForgotPassword, request.Otp, cancellationToken);
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
        var sessions = await dbContext.UserSessions
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > clock.UtcNow)
            .OrderByDescending(x => x.LastSeenAt ?? x.CreatedAt)
            .Select(x => new SessionResponse(
                x.Id,
                x.DeviceId,
                x.DeviceName,
                x.Browser,
                x.OperatingSystem,
                x.IpAddress,
                x.CreatedAt,
                x.LastSeenAt,
                x.ExpiresAt,
                x.Id == currentSessionId))
            .ToListAsync(cancellationToken);

        return sessions.CollapseDuplicateDevices();
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

    private async Task<AccountProfileResponse> BuildAccountProfileAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new AccountProfileResponse(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            user.PhoneNumber,
            user.ProfilePhotoUrl,
            user.EmailConfirmed,
            user.PhoneNumberConfirmed,
            roles.ToList(),
            user.AccountStatus.ToString(),
            user.OnboardingStatus.ToString(),
            user.DateOfBirth?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            user.Address,
            user.City,
            user.State);
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

    private DateTimeOffset? ParseProfileDateOfBirth(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        if (!DateOnly.TryParseExact(trimmed, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new AppException("Date of birth must use yyyy-MM-dd format.", 400, "invalid_date_of_birth");
        }

        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        if (date > today || date < new DateOnly(1900, 1, 1))
        {
            throw new AppException("Date of birth must be a valid past date.", 400, "invalid_date_of_birth");
        }

        return new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
    }

    private static string? NormalizeOptionalProfileText(string? value, string fieldName, int minLength, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        if (trimmed.Length < minLength || trimmed.Length > maxLength)
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [fieldName] = [$"{fieldName} must be {minLength} to {maxLength} characters."]
            });
        }

        return trimmed;
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
