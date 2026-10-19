using Joviq.Lms.Domain.Common;

namespace Joviq.Lms.Domain.Entities;

public sealed class StudentProfile : AuditableEntity
{
    public Guid UserId { get; set; }

    public DateTimeOffset? OnboardingSubmittedAt { get; set; }

    public string? OnboardingReviewStatus { get; set; }

    public string? College { get; set; }

    public string? ExecutiveName { get; set; }

    public string? Degree { get; set; }

    public string? Branch { get; set; }

    public string? WhatsAppNumber { get; set; }

    public string? CurrentYearOfStudy { get; set; }

    public string? PreferredCategoryName { get; set; }

    public string? PreferredProgramSlug { get; set; }

    public string? PreferredProgramTitle { get; set; }

    public DateOnly? PreferredStartDate { get; set; }

    public int? GraduationYear { get; set; }

    public string? CgpaOrPercentage { get; set; }

    public string? TargetJobRole { get; set; }

    public string? SkillsJson { get; set; }

    public string? ResumeUrl { get; set; }

    public string? ResumeFileName { get; set; }

    public string? ResumeContentType { get; set; }

    public long? ResumeSizeBytes { get; set; }

    public DateTimeOffset? ResumeUploadedAt { get; set; }

    public string? LinkedInUrl { get; set; }

    public string? GitHubUrl { get; set; }

    public string? PortfolioUrl { get; set; }
}
