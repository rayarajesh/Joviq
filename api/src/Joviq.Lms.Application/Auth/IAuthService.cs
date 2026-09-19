using Joviq.Lms.Application.Common.Models;

namespace Joviq.Lms.Application.Auth;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task<AuthTokenResponse> CreateCheckoutAccountAsync(CheckoutAccountRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task<AuthTokenResponse> LoginAsync(LoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task<AuthTokenResponse> ExternalLoginAsync(ExternalLoginRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task<AuthTokenResponse> RefreshAsync(string? refreshToken, RequestMetadata metadata, CancellationToken cancellationToken);

    Task LogoutAsync(Guid userId, Guid? sessionId, string? ipAddress, CancellationToken cancellationToken);

    Task LogoutAllAsync(Guid userId, string? ipAddress, CancellationToken cancellationToken);

    Task<UserSummaryResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken);

    Task<AccountProfileResponse> GetProfileAsync(Guid userId, CancellationToken cancellationToken);

    Task<AccountProfileResponse> UpdateProfileAsync(
        Guid userId,
        UpdateAccountProfileRequest request,
        RequestMetadata metadata,
        CancellationToken cancellationToken);

    Task SendEmailVerificationAsync(EmailRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task VerifyEmailAsync(VerifyEmailRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task ForgotPasswordAsync(ForgotPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task<PasswordResetVerificationResponse> VerifyForgotPasswordAsync(VerifyForgotPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task ResetPasswordAsync(ResetPasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, RequestMetadata metadata, CancellationToken cancellationToken);

    Task<IReadOnlyList<SessionResponse>> GetSessionsAsync(Guid userId, Guid? currentSessionId, CancellationToken cancellationToken);

    Task RevokeSessionAsync(Guid userId, Guid sessionId, string? ipAddress, CancellationToken cancellationToken);

    Task RevokeOtherSessionsAsync(Guid userId, Guid? currentSessionId, string? ipAddress, CancellationToken cancellationToken);

    Task RequestAccountDeletionAsync(Guid userId, RequestMetadata metadata, CancellationToken cancellationToken);

    Task ConfirmAccountDeletionAsync(Guid userId, ConfirmAccountDeletionRequest request, RequestMetadata metadata, CancellationToken cancellationToken);
}
