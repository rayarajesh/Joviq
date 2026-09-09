using System.Text.Json.Serialization;

namespace Joviq.Lms.Application.Auth;

public sealed record RegisterResponse(
    Guid UserId,
    bool EmailVerificationRequired);

public sealed record UserSummaryResponse(
    Guid Id,
    string FullName,
    string Email,
    bool EmailConfirmed,
    string? PhoneNumber,
    string? ProfilePhotoUrl,
    bool PhoneNumberConfirmed,
    IReadOnlyList<string> Roles,
    string AccountStatus,
    string OnboardingStatus);

public sealed record AccountProfileResponse(
    Guid UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? ProfilePhotoUrl,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed,
    IReadOnlyList<string> Roles,
    string AccountStatus,
    string OnboardingStatus,
    string? DateOfBirth,
    string? Address,
    string? City,
    string? State);

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
    string? DeviceId,
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
