using System.ComponentModel.DataAnnotations;

namespace Joviq.Lms.Application.Students;

public sealed record StudentOnboardingResponse(
    Guid UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
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
    [Required, RegularExpression(@"^\d{4}-\d{2}-\d{2}$")]
    public string DateOfBirth { get; init; } = string.Empty;

    [Required, MaxLength(500)]
    public string Address { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string City { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string State { get; init; } = string.Empty;
}

public sealed record UpdateAcademicDetailsRequest
{
    [Required, MaxLength(200)]
    public string College { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string Degree { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string Branch { get; init; } = string.Empty;

    [Range(2000, 2100)]
    public int GraduationYear { get; init; }

    [Required, MaxLength(32)]
    public string CgpaOrPercentage { get; init; } = string.Empty;
}

public sealed record UpdateCareerDetailsRequest
{
    [Required, MaxLength(160)]
    public string TargetJobRole { get; init; } = string.Empty;

    public IReadOnlyList<string> Skills { get; init; } = [];

    [Required, Url, MaxLength(500)]
    public string LinkedInUrl { get; init; } = string.Empty;

    [Required, Url, MaxLength(500)]
    public string GitHubUrl { get; init; } = string.Empty;

    [Required, Url, MaxLength(500)]
    public string PortfolioUrl { get; init; } = string.Empty;
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
