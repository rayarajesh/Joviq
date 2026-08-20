using Joviq.Lms.Domain.Common;

namespace Joviq.Lms.Domain.Entities;

public sealed class StudentProfile : AuditableEntity
{
    public Guid UserId { get; set; }

    public string? College { get; set; }

    public string? Degree { get; set; }

    public string? Branch { get; set; }

    public int? GraduationYear { get; set; }

    public string? CgpaOrPercentage { get; set; }

    public string? TargetJobRole { get; set; }

    public string? SkillsJson { get; set; }

    public string? ResumeUrl { get; set; }

    public string? LinkedInUrl { get; set; }

    public string? GitHubUrl { get; set; }

    public string? PortfolioUrl { get; set; }
}
