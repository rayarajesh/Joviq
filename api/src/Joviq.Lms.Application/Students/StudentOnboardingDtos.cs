using System.ComponentModel.DataAnnotations;

namespace Joviq.Lms.Application.Students;

public sealed record StudentOnboardingResponse(
    Guid UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? ProfilePhotoUrl,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed,
    string OnboardingStatus,
    PersonalDetailsResponse Personal,
    AcademicDetailsResponse Academic,
    CareerDetailsResponse Career,
    ResumeDetailsResponse Resume,
    int CompletionPercentage,
    IReadOnlyList<string> MissingFields);

public sealed record PersonalDetailsResponse(
    string? DateOfBirth,
    string? Address,
    string? City,
    string? State);

public sealed record AcademicDetailsResponse(
    string? College,
    string? Degree,
    string? Branch,
    int? GraduationYear,
    string? CgpaOrPercentage);

public sealed record CareerDetailsResponse(
    string? TargetJobRole,
    IReadOnlyList<string> Skills,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl);

public sealed record ResumeDetailsResponse(
    string? ResumeUrl,
    string? ResumeFileName,
    string? ResumeContentType,
    long? ResumeSizeBytes,
    DateTimeOffset? ResumeUploadedAt);

public sealed record UpdatePersonalDetailsRequest
{
    public string? DateOfBirth { get; init; }

    [MaxLength(500)]
    public string? Address { get; init; }

    [MaxLength(120)]
    public string? City { get; init; }

    [MaxLength(120)]
    public string? State { get; init; }
}

public sealed record UpdateAcademicDetailsRequest
{
    [MaxLength(200)]
    public string? College { get; init; }

    [MaxLength(120)]
    public string? Degree { get; init; }

    [MaxLength(120)]
    public string? Branch { get; init; }

    [Range(2000, 2100)]
    public int? GraduationYear { get; init; }

    [MaxLength(32)]
    public string? CgpaOrPercentage { get; init; }
}

public sealed record UpdateCareerDetailsRequest
{
    [MaxLength(80)]
    public string? TargetJobRole { get; init; }

    [MaxLength(15)]
    public IReadOnlyList<string> Skills { get; init; } = [];

    [MaxLength(500)]
    public string? LinkedInUrl { get; init; }

    [MaxLength(500)]
    public string? GitHubUrl { get; init; }

    [MaxLength(500)]
    public string? PortfolioUrl { get; init; }
}

public sealed record SetResumeRequest
{
    [Required, MaxLength(500)]
    public string ResumeUrl { get; init; } = string.Empty;

    [Required, MaxLength(255)]
    public string ResumeFileName { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string ResumeContentType { get; init; } = string.Empty;

    [Range(1, 5 * 1024 * 1024)]
    public long ResumeSizeBytes { get; init; }
}

public sealed record SetProfilePhotoRequest
{
    [Required, MaxLength(500)]
    public string ProfilePhotoUrl { get; init; } = string.Empty;
}
