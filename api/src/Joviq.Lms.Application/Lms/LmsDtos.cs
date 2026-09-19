using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Application.Lms;

public sealed record FaqItemResponse(string Question, string Answer);

public sealed record ProgramCategoryResponse(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    int SortOrder,
    bool IsPublished,
    IReadOnlyList<ProgramSummaryResponse> Programs);

public sealed record ProgramSummaryResponse(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Slug,
    string Title,
    string ShortDescription,
    string Level,
    string Duration,
    string LearningMode,
    string ThumbnailUrl,
    string Status,
    decimal StartingPrice,
    IReadOnlyList<string> Skills);

public sealed record ProgramDetailsResponse(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Slug,
    string Title,
    string ShortDescription,
    string Overview,
    string Level,
    string Duration,
    string LearningMode,
    string CertificationName,
    string ThumbnailUrl,
    string Status,
    IReadOnlyList<string> Skills,
    IReadOnlyList<string> Outcomes,
    IReadOnlyList<FaqItemResponse> Faqs,
    IReadOnlyList<ProgramPlanResponse> Plans,
    IReadOnlyList<CurriculumModuleResponse> Curriculum,
    IReadOnlyList<ProjectResponse> Projects);

public sealed record ProgramPlanResponse(
    Guid Id,
    Guid ProgramId,
    string Name,
    string Code,
    decimal ActualPrice,
    decimal OfferPrice,
    decimal ReserveAmount,
    IReadOnlyList<string> Features,
    bool IsActive);

public sealed record CurriculumModuleResponse(
    Guid Id,
    Guid ProgramId,
    string Title,
    string Description,
    int SortOrder,
    bool IsActive,
    IReadOnlyList<LessonResponse> Lessons);

public sealed record LessonResponse(
    Guid Id,
    Guid ModuleId,
    string Title,
    string Summary,
    string? VideoUrl,
    string? NotesUrl,
    int DurationMinutes,
    string AccessLevel,
    int SortOrder,
    bool IsActive,
    bool IsLocked,
    int ProgressPercentage,
    bool IsCompleted,
    IReadOnlyList<LessonResourceResponse> Resources);

public sealed record LessonResourceResponse(Guid Id, string Title, string ResourceType, string Url);

public sealed record EnrollmentResponse(
    Guid Id,
    Guid StudentId,
    Guid ProgramId,
    string ProgramSlug,
    string ProgramTitle,
    Guid? ProgramPlanId,
    string? ProgramPlanName,
    string? ProgramPlanCode,
    string Status,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal BalanceAmount,
    DateTimeOffset EnrolledAt,
    DateOnly? StartDate,
    DateTimeOffset? FullAccessUnlockedAt,
    string? LockedReason,
    DateTimeOffset? AccessExpiresAt,
    bool IsAccessExpired,
    bool HasFullAccess,
    int AccessCycle,
    string? StudentName = null,
    string? StudentEmail = null,
    string? StudentPhone = null);

public sealed record StudentLmsDashboardResponse(
    EnrollmentResponse? Enrollment,
    string ProgramStatus,
    int LearningProgressPercentage,
    int CompletedLessons,
    int TotalLessons,
    int PendingProjects,
    CertificateResponse? LatestCertificate,
    decimal BalanceDue,
    IReadOnlyList<NotificationResponse> Notifications);

public sealed record StudentProgramWorkspaceResponse(
    EnrollmentResponse? Enrollment,
    IReadOnlyList<ProjectResponse> Projects,
    IReadOnlyList<CertificateResponse> Certificates,
    IReadOnlyList<PaymentTransactionResponse> Payments);

public sealed record StudentEnrolledProgramResponse(
    EnrollmentResponse Enrollment,
    ProgramDetailsResponse Program,
    int CompletedLessons,
    int TotalLessons,
    int ProgressPercentage,
    IReadOnlyList<CertificateResponse> Certificates);

public sealed record StudentMyProgramsResponse(
    IReadOnlyList<StudentEnrolledProgramResponse> Programs);

public sealed record PaymentTransactionResponse(
    Guid Id,
    Guid? EnrollmentId,
    Guid ProgramId,
    Guid? ProgramPlanId,
    string Gateway,
    string GatewayOrderId,
    string? GatewayPaymentId,
    string Mode,
    string Status,
    decimal Amount,
    string Currency,
    DateTimeOffset CreatedAt,
    DateTimeOffset? VerifiedAt,
    string? InvoiceNumber,
    string? FailureReason,
    decimal OriginalAmount,
    decimal DiscountAmount,
    string? CouponCode,
    Guid StudentId,
    string? StudentName,
    string? StudentEmail,
    string? ProgramTitle,
    string? ProgramPlanName);

public sealed record CouponValidationResponse(
    string Code,
    string Description,
    decimal OriginalAmount,
    decimal DiscountAmount,
    decimal PayableAmount);

public sealed record PaymentCheckoutResponse(
    PaymentTransactionResponse Transaction,
    string Provider,
    string PublicKey,
    string GatewayOrderId,
    long AmountInMinorUnits,
    string Currency,
    DateTimeOffset ExpiresAt,
    string? PaymentSessionId = null,
    string? PaymentEnvironment = null);

public sealed record PaymentReceiptResponse(
    Guid PaymentId,
    string InvoiceNumber,
    string Status,
    string StudentName,
    string StudentEmail,
    string ProgramTitle,
    string PlanName,
    string PaymentMode,
    decimal Amount,
    decimal OriginalAmount,
    decimal DiscountAmount,
    string? CouponCode,
    string Currency,
    string Gateway,
    string GatewayOrderId,
    string? GatewayPaymentId,
    DateTimeOffset? PaidAt,
    DateTimeOffset CreatedAt);

public sealed record ProjectLinkResponse(string Label, string Url);

public sealed record ProjectStudentResponse(
    Guid StudentId,
    Guid EnrollmentId,
    string FullName,
    string Email,
    Guid ProgramId,
    string ProgramTitle,
    DateTimeOffset EnrolledAt);

public sealed record ProjectSubmissionReviewResponse(
    Guid Id,
    Guid ProjectId,
    Guid ProgramId,
    string ProjectTitle,
    string ProgramTitle,
    Guid StudentId,
    string StudentName,
    string StudentEmail,
    decimal MaxScore,
    SubmissionResponse Submission);

public sealed record ProjectResponse(
    Guid Id,
    Guid ProgramId,
    string Title,
    string Description,
    IReadOnlyList<string> RequiredArtifacts,
    IReadOnlyList<ProjectLinkResponse> UsefulLinks,
    string? ReferenceMediaUrl,
    DateTimeOffset? Deadline,
    decimal MaxScore,
    bool IsPublished,
    int AssignedStudentCount,
    SubmissionResponse? LatestSubmission);

public sealed record SubmissionResponse(
    Guid Id,
    Guid ItemId,
    string ItemType,
    string Status,
    decimal? Score,
    string? Feedback,
    string? SubmissionUrl,
    string? FileUrl,
    Guid? FileAssetId,
    string? GitHubUrl,
    string? DemoUrl,
    string? DocumentationUrl,
    string? PresentationUrl,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt);

public sealed record CertificateResponse(
    Guid Id,
    Guid StudentId,
    Guid ProgramId,
    string ProgramTitle,
    string Type,
    string Status,
    string CertificateId,
    DateTimeOffset? IssuedAt,
    string VerificationSlug,
    string? VerificationUrl,
    string? QrCodeUrl,
    string? AuthorizedSignatory);

public sealed record CertificateVerificationResponse(
    bool IsValid,
    string CertificateId,
    string StudentName,
    string ProgramTitle,
    string Type,
    DateTimeOffset? IssuedAt,
    string Status);

public sealed record NotificationResponse(
    Guid Id,
    string Title,
    string Body,
    string? ActionUrl,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReadAt);

public sealed record LeadCaptureResponse(Guid Id, string Status, DateTimeOffset CreatedAt);

public sealed record AdminLmsSummaryResponse(
    int Programs,
    int PublishedPrograms,
    int Enrollments,
    int ActiveEnrollments,
    decimal VerifiedRevenue,
    int PendingProjectReviews,
    int NewCallbackRequests);

public sealed record CouponResponse(
    Guid Id,
    string Code,
    string Description,
    decimal DiscountValue,
    bool IsPercentage,
    bool IsActive,
    DateTimeOffset? StartsAt,
    DateTimeOffset? ExpiresAt,
    CouponAudienceType AudienceType,
    decimal? MinimumOrderAmount,
    decimal? MaximumDiscountAmount,
    int? MaxRedemptions,
    int MaxRedemptionsPerStudent,
    IReadOnlyList<Guid> TargetStudentIds,
    IReadOnlyList<string> TargetStudentEmails,
    IReadOnlyList<Guid> TargetProgramIds,
    IReadOnlyList<Guid> TargetCategoryIds);

public sealed record AdminNotificationResponse(
    Guid Id,
    Guid UserId,
    string? UserName,
    string? UserEmail,
    string Title,
    string Body,
    string? ActionUrl,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReadAt);

public sealed class ProgramListRequest
{
    public string? Search { get; init; }

    public string? CategorySlug { get; init; }

    public bool IncludeDrafts { get; init; }
}

public sealed class CallbackRequestCreateRequest
{
    public string FullName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;

    public string? InterestedProgram { get; init; }

    public string? Notes { get; init; }
}

public sealed class EnquiryCreateRequest
{
    public string FullName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;

    public string Topic { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;
}

public sealed class CreateProgramRequest
{
    public Guid CategoryId { get; init; }

    public string Slug { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string ShortDescription { get; init; } = string.Empty;

    public string Overview { get; init; } = string.Empty;

    public string Level { get; init; } = string.Empty;

    public string Duration { get; init; } = string.Empty;

    public string LearningMode { get; init; } = string.Empty;

    public string CertificationName { get; init; } = string.Empty;

    public string? ThumbnailUrl { get; init; }

    public IReadOnlyList<string> Skills { get; init; } = [];

    public IReadOnlyList<string> Outcomes { get; init; } = [];

    public IReadOnlyList<FaqItemResponse> Faqs { get; init; } = [];

    public ProgramStatus Status { get; init; } = ProgramStatus.Published;
}

public sealed class UpdateProgramRequest
{
    public Guid CategoryId { get; init; }

    public string Slug { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string ShortDescription { get; init; } = string.Empty;

    public string Overview { get; init; } = string.Empty;

    public string Level { get; init; } = string.Empty;

    public string Duration { get; init; } = string.Empty;

    public string LearningMode { get; init; } = string.Empty;

    public string CertificationName { get; init; } = string.Empty;

    public string? ThumbnailUrl { get; init; }

    public IReadOnlyList<string> Skills { get; init; } = [];

    public IReadOnlyList<string> Outcomes { get; init; } = [];

    public IReadOnlyList<FaqItemResponse> Faqs { get; init; } = [];

    public ProgramStatus Status { get; init; } = ProgramStatus.Published;
}

public sealed class CreatePlanRequest
{
    public string Name { get; init; } = string.Empty;

    public string Code { get; init; } = string.Empty;

    public decimal ActualPrice { get; init; }

    public decimal OfferPrice { get; init; }

    public decimal ReserveAmount { get; init; }

    public IReadOnlyList<string> Features { get; init; } = [];

    public bool IsActive { get; init; } = true;
}

public sealed class CreateCategoryRequest
{
    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public bool IsPublished { get; init; } = true;
}

public sealed class CreateModuleRequest
{
    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public int? SortOrder { get; init; }

    public bool? IsActive { get; init; }
}

public sealed class ReorderItemsRequest
{
    public IReadOnlyList<Guid> OrderedIds { get; init; } = [];
}

public sealed class LessonResourceRequest
{
    public string Title { get; init; } = string.Empty;

    public string ResourceType { get; init; } = string.Empty;

    public string Url { get; init; } = string.Empty;
}

public sealed class CreateLessonRequest
{
    public string Title { get; init; } = string.Empty;

    public string Summary { get; init; } = string.Empty;

    public string? VideoUrl { get; init; }

    public string? NotesUrl { get; init; }

    public int DurationMinutes { get; init; }

    public ContentAccessLevel AccessLevel { get; init; } = ContentAccessLevel.Full;

    public int? SortOrder { get; init; }

    public bool? IsActive { get; init; }

    public IReadOnlyList<LessonResourceRequest> Resources { get; init; } = [];
}

public sealed class CreateProjectRequest
{
    public Guid ProgramId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public IReadOnlyList<string> RequiredArtifacts { get; init; } = [];

    public IReadOnlyList<ProjectLinkRequest> UsefulLinks { get; init; } = [];

    public string? ReferenceMediaUrl { get; init; }

    public DateTimeOffset? Deadline { get; init; }

    public decimal MaxScore { get; init; } = 100;

    public bool IsPublished { get; init; }
}

public sealed class ProjectLinkRequest
{
    public string Label { get; init; } = string.Empty;

    public string Url { get; init; } = string.Empty;
}

public sealed class PublishProjectRequest
{
    public IReadOnlyList<Guid> StudentIds { get; init; } = [];
}

public sealed class CreateEnrollmentRequest
{
    public Guid ProgramId { get; init; }

    public Guid? ProgramPlanId { get; init; }

    public DateOnly? StartDate { get; init; }
}

public sealed class UpdateEnrollmentStatusRequest
{
    public EnrollmentStatus Status { get; init; }

    public string? LockedReason { get; init; }
}

public sealed class CreatePaymentCheckoutRequest
{
    public Guid ProgramId { get; init; }

    public Guid? ProgramPlanId { get; init; }

    public Guid? EnrollmentId { get; init; }

    public PaymentMode Mode { get; init; } = PaymentMode.ReserveSeat;

    public string? CouponCode { get; init; }

    public string? CustomerName { get; init; }

    public string? CustomerEmail { get; init; }

    public string? CustomerPhone { get; init; }

    public string? CustomerCollege { get; init; }
}

public sealed class ValidateCouponRequest
{
    public Guid ProgramId { get; init; }

    public Guid? ProgramPlanId { get; init; }

    public Guid? EnrollmentId { get; init; }

    public PaymentMode Mode { get; init; } = PaymentMode.RemainingBalance;

    public string CouponCode { get; init; } = string.Empty;
}

public sealed class UpdatePaymentStatusRequest
{
    public PaymentStatus Status { get; init; }

    public string? GatewayPaymentId { get; init; }

    public string? FailureReason { get; init; }
}

public sealed class CreateAdminNotificationRequest
{
    public Guid? UserId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Body { get; init; } = string.Empty;

    public string? ActionUrl { get; init; }

    public bool SendToAllUsers { get; init; }

    public bool SendToAllStudents { get; init; }

}

public sealed class VerifyPaymentRequest
{
    public Guid? PaymentTransactionId { get; init; }

    public string? GatewayOrderId { get; init; }

    public string? GatewayPaymentId { get; init; }

    public string? GatewaySignature { get; init; }
}

public sealed class SubmitProjectRequest
{
    public Guid? FileAssetId { get; init; }

    public string? GitHubUrl { get; init; }

    public string? DemoUrl { get; init; }

    public string? DocumentationUrl { get; init; }

    public string? PresentationUrl { get; init; }

    public string? Notes { get; init; }
}

public sealed class ReviewProjectSubmissionRequest
{
    public SubmissionStatus Status { get; init; } = SubmissionStatus.Approved;

    public decimal? Score { get; init; }

    public string? Feedback { get; init; }
}

public sealed class CreateCouponRequest
{
    public string Code { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public decimal DiscountValue { get; init; }

    public bool IsPercentage { get; init; }

    public bool IsActive { get; init; } = true;

    public DateTimeOffset? StartsAt { get; init; }

    public DateTimeOffset? ExpiresAt { get; init; }

    public CouponAudienceType AudienceType { get; init; } = CouponAudienceType.Everyone;

    public decimal? MinimumOrderAmount { get; init; }

    public decimal? MaximumDiscountAmount { get; init; }

    public int? MaxRedemptions { get; init; }

    public int MaxRedemptionsPerStudent { get; init; } = 1;

    public IReadOnlyList<Guid> TargetStudentIds { get; init; } = [];

    public IReadOnlyList<string> TargetStudentEmails { get; init; } = [];

    public IReadOnlyList<Guid> TargetProgramIds { get; init; } = [];

    public IReadOnlyList<Guid> TargetCategoryIds { get; init; } = [];
}

public sealed class IssueCertificateRequest
{
    public Guid StudentId { get; init; }

    public Guid ProgramId { get; init; }

    public Guid? EnrollmentId { get; init; }

    public CertificateType Type { get; init; } = CertificateType.Training;

    public string? AuthorizedSignatory { get; init; }
}

public sealed class UpdateCertificateStatusRequest
{
    public CertificateStatus Status { get; init; } = CertificateStatus.Issued;
}
