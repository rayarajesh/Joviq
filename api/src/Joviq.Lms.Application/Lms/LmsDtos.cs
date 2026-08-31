using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Application.Lms;

public sealed record FaqItemResponse(string Question, string Answer);

public sealed record ProgramCategoryResponse(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    int SortOrder,
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
    string MentorSummary,
    string CertificationName,
    string ThumbnailUrl,
    string Status,
    IReadOnlyList<string> Skills,
    IReadOnlyList<string> Outcomes,
    IReadOnlyList<FaqItemResponse> Faqs,
    IReadOnlyList<ProgramPlanResponse> Plans,
    IReadOnlyList<CurriculumModuleResponse> Curriculum,
    IReadOnlyList<ProjectResponse> Projects,
    IReadOnlyList<AssignmentResponse> Assignments,
    IReadOnlyList<AssessmentResponse> Assessments);

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
    bool IsLocked,
    int ProgressPercentage,
    bool IsCompleted,
    IReadOnlyList<LessonResourceResponse> Resources);

public sealed record LessonResourceResponse(Guid Id, string Title, string ResourceType, string Url);

public sealed record EnrollmentResponse(
    Guid Id,
    Guid StudentId,
    Guid ProgramId,
    string ProgramTitle,
    Guid? ProgramPlanId,
    string? ProgramPlanName,
    string Status,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal BalanceAmount,
    DateTimeOffset EnrolledAt,
    DateTimeOffset? FullAccessUnlockedAt,
    string? LockedReason);

public sealed record StudentLmsDashboardResponse(
    EnrollmentResponse? Enrollment,
    string ProgramStatus,
    int LearningProgressPercentage,
    int CompletedLessons,
    int TotalLessons,
    int PendingAssignments,
    int PendingProjects,
    int UpcomingAssessments,
    LiveClassResponse? UpcomingClass,
    AssignmentResponse? PendingAssignment,
    AssessmentResponse? UpcomingAssessment,
    CertificateResponse? LatestCertificate,
    decimal BalanceDue,
    IReadOnlyList<NotificationResponse> Notifications);

public sealed record StudentProgramWorkspaceResponse(
    EnrollmentResponse? Enrollment,
    IReadOnlyList<CurriculumModuleResponse> Curriculum,
    IReadOnlyList<LiveClassResponse> LiveClasses,
    IReadOnlyList<AssignmentResponse> Assignments,
    IReadOnlyList<ProjectResponse> Projects,
    IReadOnlyList<AssessmentResponse> Assessments,
    IReadOnlyList<CertificateResponse> Certificates,
    IReadOnlyList<PaymentTransactionResponse> Payments);

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
    DateTimeOffset? VerifiedAt);

public sealed record LiveClassResponse(
    Guid Id,
    Guid ProgramId,
    string Title,
    string Description,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? JoinUrl,
    string? RecordingUrl,
    string Status);

public sealed record AssignmentResponse(
    Guid Id,
    Guid ProgramId,
    string Title,
    string Instructions,
    DateTimeOffset? DueAt,
    decimal MaxScore,
    bool IsPublished,
    SubmissionResponse? LatestSubmission);

public sealed record ProjectResponse(
    Guid Id,
    Guid ProgramId,
    string Title,
    string Description,
    IReadOnlyList<string> RequiredArtifacts,
    decimal MaxScore,
    bool IsPublished,
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
    string? GitHubUrl,
    string? DemoUrl,
    string? DocumentationUrl,
    string? PresentationUrl,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt);

public sealed record AssessmentResponse(
    Guid Id,
    Guid ProgramId,
    string Title,
    string AssessmentType,
    string Instructions,
    int DurationMinutes,
    decimal PassingPercentage,
    bool IsAiPowered,
    bool IsPublished);

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

public sealed record SupportTicketResponse(
    Guid Id,
    Guid? UserId,
    Guid? ProgramId,
    string Name,
    string Email,
    string? StudentIdText,
    string Issue,
    string Description,
    string? AttachmentUrl,
    string Priority,
    string Status,
    string? AdminNotes,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

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
    int PendingAssignmentReviews,
    int PendingProjectReviews,
    int OpenSupportTickets,
    int NewCallbackRequests);

public sealed record MentorDashboardResponse(
    int AssignedLiveClasses,
    int PendingAssignmentReviews,
    int PendingProjectReviews,
    int ReviewedSubmissions);

public sealed record MentorReviewQueueResponse(
    IReadOnlyList<SubmissionResponse> AssignmentSubmissions,
    IReadOnlyList<SubmissionResponse> ProjectSubmissions);

public sealed record RecordedClassResponse(
    Guid LessonId,
    Guid ModuleId,
    string ModuleTitle,
    string Title,
    string Summary,
    string? VideoUrl,
    string? NotesUrl,
    int DurationMinutes,
    bool IsLocked,
    int ProgressPercentage,
    bool IsCompleted);

public sealed record AssessmentAttemptResponse(
    Guid Id,
    Guid AssessmentId,
    string AssessmentTitle,
    Guid StudentId,
    Guid? EnrollmentId,
    string Status,
    DateTimeOffset StartedAt,
    DateTimeOffset? SubmittedAt,
    decimal? Score,
    string? ResultJson);

public sealed record AiInterviewAttemptResponse(
    Guid Id,
    Guid StudentId,
    Guid? EnrollmentId,
    string JobRole,
    string Domain,
    string InterviewType,
    decimal? TechnicalScore,
    decimal? CommunicationScore,
    decimal? OverallScore,
    string? TranscriptJson,
    string? RecommendationsJson,
    string Status,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt);

public sealed record CareerSupportResponse(
    string ResumeStatus,
    string LinkedInStatus,
    string GitHubStatus,
    string PortfolioStatus,
    IReadOnlyList<string> InterviewFocusAreas,
    IReadOnlyList<SupportTicketResponse> Requests);

public sealed record MentorLearnerResponse(
    Guid StudentId,
    string FullName,
    string Email,
    string? PhoneNumber,
    Guid EnrollmentId,
    string ProgramTitle,
    string EnrollmentStatus,
    int ProgressPercentage,
    DateTimeOffset EnrolledAt);

public sealed record CouponResponse(
    Guid Id,
    string Code,
    string Description,
    decimal DiscountValue,
    bool IsPercentage,
    bool IsActive,
    DateTimeOffset? StartsAt,
    DateTimeOffset? ExpiresAt);

public sealed record AdminReportResponse(
    AdminLmsSummaryResponse Summary,
    IReadOnlyList<ProgramSummaryResponse> Programs,
    IReadOnlyList<EnrollmentResponse> RecentEnrollments,
    IReadOnlyList<PaymentTransactionResponse> RecentPayments,
    IReadOnlyList<SupportTicketResponse> OpenSupportTickets);

public sealed record AdminContentItemResponse(
    Guid Id,
    string ContentType,
    string Title,
    string Slug,
    string? Summary,
    string? Body,
    string? ImageUrl,
    string? ExternalUrl,
    string MetadataJson,
    string Status,
    bool IsFeatured,
    int SortOrder,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record AdminLeadResponse(
    Guid Id,
    string LeadType,
    string FullName,
    string Email,
    string PhoneNumber,
    string? Subject,
    string? Secondary,
    string? Message,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

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

public sealed record AdminSettingResponse(
    Guid Id,
    string Category,
    string Key,
    string Value,
    string? Description,
    bool IsSecret,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record AdminAiFeatureSummaryResponse(
    int AiAssessments,
    int AiAssessmentAttempts,
    int AiInterviewAttempts,
    int CompletedAiInterviews,
    decimal AverageAssessmentScore,
    decimal AverageInterviewScore);

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

public sealed class CampusAmbassadorApplyRequest
{
    public string FullName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;

    public string College { get; init; } = string.Empty;

    public string City { get; init; } = string.Empty;

    public string WhyJoin { get; init; } = string.Empty;
}

public sealed class CareerApplyRequest
{
    public string FullName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public string? ResumeUrl { get; init; }

    public string? PortfolioUrl { get; init; }

    public string? CoverNote { get; init; }
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

    public string MentorSummary { get; init; } = string.Empty;

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

    public string MentorSummary { get; init; } = string.Empty;

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
}

public sealed class CreateLessonRequest
{
    public string Title { get; init; } = string.Empty;

    public string Summary { get; init; } = string.Empty;

    public string? VideoUrl { get; init; }

    public string? NotesUrl { get; init; }

    public int DurationMinutes { get; init; }

    public ContentAccessLevel AccessLevel { get; init; } = ContentAccessLevel.Full;
}

public sealed class CreateLiveClassRequest
{
    public Guid ProgramId { get; init; }

    public Guid? MentorId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public DateTimeOffset StartsAt { get; init; }

    public DateTimeOffset EndsAt { get; init; }

    public string? JoinUrl { get; init; }

    public string? RecordingUrl { get; init; }
}

public sealed class CreateAssignmentRequest
{
    public Guid ProgramId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Instructions { get; init; } = string.Empty;

    public DateTimeOffset? DueAt { get; init; }

    public decimal MaxScore { get; init; } = 100;

    public bool IsPublished { get; init; } = true;
}

public sealed class CreateProjectRequest
{
    public Guid ProgramId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public IReadOnlyList<string> RequiredArtifacts { get; init; } = [];

    public decimal MaxScore { get; init; } = 100;

    public bool IsPublished { get; init; } = true;
}

public sealed class CreateAssessmentRequest
{
    public Guid ProgramId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string AssessmentType { get; init; } = string.Empty;

    public string Instructions { get; init; } = string.Empty;

    public int DurationMinutes { get; init; }

    public decimal PassingPercentage { get; init; } = 70;

    public bool IsAiPowered { get; init; }

    public bool IsPublished { get; init; } = true;
}

public sealed class CreateEnrollmentRequest
{
    public Guid ProgramId { get; init; }

    public Guid? ProgramPlanId { get; init; }
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
}

public sealed class UpdatePaymentStatusRequest
{
    public PaymentStatus Status { get; init; }

    public string? GatewayPaymentId { get; init; }

    public string? FailureReason { get; init; }
}

public sealed class RefundPaymentRequest
{
    public string? Reason { get; init; }
}

public sealed class CreateAdminContentItemRequest
{
    public AdminContentType ContentType { get; init; } = AdminContentType.WebsiteContent;

    public string Title { get; init; } = string.Empty;

    public string? Slug { get; init; }

    public string? Summary { get; init; }

    public string? Body { get; init; }

    public string? ImageUrl { get; init; }

    public string? ExternalUrl { get; init; }

    public string? MetadataJson { get; init; }

    public AdminContentStatus Status { get; init; } = AdminContentStatus.Draft;

    public bool IsFeatured { get; init; }

    public int SortOrder { get; init; }
}

public sealed class UpdateLeadStatusRequest
{
    public LeadStatus Status { get; init; }

    public string? Notes { get; init; }
}

public sealed class CreateAdminNotificationRequest
{
    public Guid? UserId { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Body { get; init; } = string.Empty;

    public string? ActionUrl { get; init; }

    public bool SendToAllUsers { get; init; }

    public bool SendToAllStudents { get; init; }

    public bool SendToAllMentors { get; init; }
}

public sealed class UpsertAdminSettingRequest
{
    public string Value { get; init; } = string.Empty;

    public string? Description { get; init; }

    public bool IsSecret { get; init; }
}

public sealed class VerifyPaymentRequest
{
    public Guid? PaymentTransactionId { get; init; }

    public string? GatewayOrderId { get; init; }

    public string? GatewayPaymentId { get; init; }
}

public sealed class SubmitAssessmentAttemptRequest
{
    public decimal? Score { get; init; }

    public string? ResultJson { get; init; }
}

public sealed class StartAiInterviewRequest
{
    public string JobRole { get; init; } = string.Empty;

    public string Domain { get; init; } = string.Empty;

    public string InterviewType { get; init; } = "Technical";
}

public sealed class UpdateLessonProgressRequest
{
    public int ProgressPercentage { get; init; }
}

public sealed class SubmitAssignmentRequest
{
    public string? SubmissionUrl { get; init; }

    public string? FileUrl { get; init; }

    public string? Notes { get; init; }
}

public sealed class SubmitProjectRequest
{
    public string? GitHubUrl { get; init; }

    public string? DemoUrl { get; init; }

    public string? DocumentationUrl { get; init; }

    public string? PresentationUrl { get; init; }

    public string? Notes { get; init; }
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

public sealed class CreateSupportTicketRequest
{
    public Guid? ProgramId { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string? StudentIdText { get; init; }

    public string Issue { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public string? AttachmentUrl { get; init; }

    public string Priority { get; init; } = "Normal";
}

public sealed class ReviewSubmissionRequest
{
    public decimal Score { get; init; }

    public string Feedback { get; init; } = string.Empty;

    public SubmissionStatus Status { get; init; } = SubmissionStatus.Approved;
}

public sealed class UpdateSupportTicketRequest
{
    public SupportTicketStatus Status { get; init; }

    public string? AdminNotes { get; init; }
}
