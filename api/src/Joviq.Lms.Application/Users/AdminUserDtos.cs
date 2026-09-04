using System.ComponentModel.DataAnnotations;
using Joviq.Lms.Application.Common.Validation;

namespace Joviq.Lms.Application.Users;

public sealed record AdminUserListRequest
{
    public string? Search { get; init; }

    public string? Role { get; init; }

    public string? Status { get; init; }

    public string? SortBy { get; init; } = "CreatedAt";

    public string? SortDirection { get; init; } = "Desc";

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}

public sealed record CreateAdminUserRequest
{
    [Required, MaxLength(160)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, IndianMobileNumber, MaxLength(16)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required]
    public string Role { get; init; } = string.Empty;

    [Required, MinLength(8)]
    public string TemporaryPassword { get; init; } = string.Empty;
}

public sealed record UpdateUserStatusRequest
{
    [Required]
    public string AccountStatus { get; init; } = string.Empty;
}

public sealed record UpdateUserRolesRequest
{
    [Required]
    public IReadOnlyList<string> Roles { get; init; } = [];
}

public sealed record UpdateAdminUserRequest
{
    [Required, MaxLength(160)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, IndianMobileNumber, MaxLength(16)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required]
    public string Role { get; init; } = string.Empty;

    [Required]
    public string AccountStatus { get; init; } = string.Empty;
}

public sealed record AdminUserResponse(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? ProfilePhotoUrl,
    bool EmailConfirmed,
    IReadOnlyList<string> Roles,
    string AccountStatus,
    string OnboardingStatus,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record AdminUserSummaryResponse(
    int TotalUsers,
    int Students,
    int Admins,
    int Active,
    int Locked,
    int PendingEmailVerification);
