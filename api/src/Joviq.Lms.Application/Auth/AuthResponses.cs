using System.Text.Json.Serialization;

namespace Joviq.Lms.Application.Auth;

public sealed record RegisterResponse(
    Guid UserId,
    bool EmailVerificationRequired,
    bool PhoneVerificationRequired);

public sealed record UserSummaryResponse(
    Guid Id,
    string FullName,
    string Email,
    bool EmailConfirmed,
    string? PhoneNumber,
    bool PhoneNumberConfirmed,
    IReadOnlyList<string> Roles,
    string AccountStatus,
    string OnboardingStatus);

public sealed record AuthTokenResponse
{
    public string? AccessToken { get; init; }

    public int ExpiresIn { get; init; }

    public UserSummaryResponse User { get; init; } = default!;

    [JsonIgnore]
    public string RefreshToken { get; init; } = string.Empty;

    [JsonIgnore]
    public DateTimeOffset RefreshTokenExpiresAt { get; init; }
}

public sealed record SessionResponse(
    Guid Id,
    string? DeviceName,
    string? Browser,
    string? OperatingSystem,
    string? IpAddress,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastSeenAt,
    DateTimeOffset ExpiresAt,
    bool IsCurrent);

public sealed record PasswordResetVerificationResponse(
    Guid UserId,
    string ResetToken);
