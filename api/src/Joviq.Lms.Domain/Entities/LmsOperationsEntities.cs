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

    public decimal DiscountAmount { get; set; }

    public DateTimeOffset EnrolledAt { get; set; }

    public DateTimeOffset? FullAccessUnlockedAt { get; set; }

    public DateTimeOffset? AccessExpiresAt { get; set; }

    public int AccessCycle { get; set; } = 1;

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

    public decimal OriginalAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public Guid? CouponId { get; set; }

    public Coupon? Coupon { get; set; }

    public string? CouponCode { get; set; }

    public string Currency { get; set; } = "INR";

    public string? FailureReason { get; set; }

    public DateTimeOffset? VerifiedAt { get; set; }

    public DateTimeOffset? CheckoutExpiresAt { get; set; }

    public string? InvoiceNumber { get; set; }
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

    public CouponAudienceType AudienceType { get; set; } = CouponAudienceType.Everyone;

    public decimal? MinimumOrderAmount { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    public int? MaxRedemptions { get; set; }

    public int MaxRedemptionsPerStudent { get; set; } = 1;

    public string TargetStudentIdsJson { get; set; } = "[]";

    public string TargetStudentEmailsJson { get; set; } = "[]";

    public string TargetProgramIdsJson { get; set; } = "[]";

    public string TargetCategoryIdsJson { get; set; } = "[]";
}

public sealed class CouponRedemption : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid CouponId { get; set; }

    public Coupon? Coupon { get; set; }

    public Guid StudentId { get; set; }

    public Guid EnrollmentId { get; set; }

    public Guid PaymentTransactionId { get; set; }

    public CouponRedemptionStatus Status { get; set; } = CouponRedemptionStatus.Reserved;

    public decimal OriginalAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal FinalAmount { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
}

public sealed class Project : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string RequiredArtifactsJson { get; set; } = "[]";

    public string UsefulLinksJson { get; set; } = "[]";

    public string? ReferenceMediaUrl { get; set; }

    public DateTimeOffset? Deadline { get; set; }

    public decimal MaxScore { get; set; } = 100;

    public bool IsPublished { get; set; }

    public ICollection<ProjectAssignment> Assignments { get; set; } = new List<ProjectAssignment>();
}

public sealed class ProjectAssignment : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Enrollment? Enrollment { get; set; }

    public DateTimeOffset AssignedAt { get; set; }
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

    public Guid? FileAssetId { get; set; }

    public string? Notes { get; set; }

    public decimal? Score { get; set; }

    public string? Feedback { get; set; }

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public Guid? ReviewedById { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }
}
