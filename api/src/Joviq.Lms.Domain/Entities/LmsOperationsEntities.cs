using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class Enrollment : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public Guid? ProgramPlanId { get; set; }

    public ProgramPlan? ProgramPlan { get; set; }

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Reserved;

    public decimal TotalAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public DateTimeOffset EnrolledAt { get; set; }

    public DateTimeOffset? FullAccessUnlockedAt { get; set; }

    public string? LockedReason { get; set; }
}

public sealed class PaymentTransaction : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Enrollment? Enrollment { get; set; }

    public Guid ProgramId { get; set; }

    public Guid? ProgramPlanId { get; set; }

    public string Gateway { get; set; } = "Manual";

    public string GatewayOrderId { get; set; } = string.Empty;

    public string? GatewayPaymentId { get; set; }

    public PaymentMode Mode { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "INR";

    public string? FailureReason { get; set; }

    public DateTimeOffset? VerifiedAt { get; set; }
}

public sealed class Coupon : AuditableEntity
{
    public Guid Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal DiscountValue { get; set; }

    public bool IsPercentage { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset? StartsAt { get; set; }

    public DateTimeOffset? ExpiresAt { get; set; }
}

public sealed class LiveClass : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public Guid? MentorId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartsAt { get; set; }

    public DateTimeOffset EndsAt { get; set; }

    public string? JoinUrl { get; set; }

    public string? RecordingUrl { get; set; }

    public LiveClassStatus Status { get; set; } = LiveClassStatus.Scheduled;
}

public sealed class Assignment : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public DateTimeOffset? DueAt { get; set; }

    public decimal MaxScore { get; set; } = 100;

    public bool IsPublished { get; set; }
}

public sealed class AssignmentSubmission : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid AssignmentId { get; set; }

    public Assignment? Assignment { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Enrollment? Enrollment { get; set; }

    public string? SubmissionUrl { get; set; }

    public string? FileUrl { get; set; }

    public string? Notes { get; set; }

    public decimal? Score { get; set; }

    public string? Feedback { get; set; }

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public Guid? ReviewedById { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }
}

public sealed class Project : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string RequiredArtifactsJson { get; set; } = "[]";

    public decimal MaxScore { get; set; } = 100;

    public bool IsPublished { get; set; }
}

public sealed class ProjectSubmission : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Enrollment? Enrollment { get; set; }

    public string? GitHubUrl { get; set; }

    public string? DemoUrl { get; set; }

    public string? DocumentationUrl { get; set; }

    public string? PresentationUrl { get; set; }

    public string? Notes { get; set; }

    public decimal? Score { get; set; }

    public string? Feedback { get; set; }

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public Guid? ReviewedById { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }
}
