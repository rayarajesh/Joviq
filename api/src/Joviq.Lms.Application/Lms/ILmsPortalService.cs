using Joviq.Lms.Application.Common.Models;

namespace Joviq.Lms.Application.Lms;

public interface ILmsPortalService
{
    Task<IReadOnlyList<ProgramCategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ProgramSummaryResponse>> GetProgramsAsync(ProgramListRequest request, CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> GetProgramBySlugAsync(string slug, CancellationToken cancellationToken);

    Task<LeadCaptureResponse> CreateCallbackRequestAsync(CallbackRequestCreateRequest request, CancellationToken cancellationToken);

    Task<LeadCaptureResponse> CreateEnquiryAsync(EnquiryCreateRequest request, CancellationToken cancellationToken);

    Task<LeadCaptureResponse> ApplyCampusAmbassadorAsync(CampusAmbassadorApplyRequest request, CancellationToken cancellationToken);

    Task<LeadCaptureResponse> ApplyCareerAsync(CareerApplyRequest request, CancellationToken cancellationToken);

    Task<CertificateVerificationResponse> VerifyCertificateAsync(string certificateId, CancellationToken cancellationToken);

    Task<StudentLmsDashboardResponse> GetStudentDashboardAsync(Guid studentId, CancellationToken cancellationToken);

    Task<StudentProgramWorkspaceResponse> GetStudentWorkspaceAsync(Guid studentId, CancellationToken cancellationToken);

    Task<EnrollmentResponse> CreateEnrollmentAsync(Guid studentId, CreateEnrollmentRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> CreatePaymentCheckoutAsync(Guid studentId, CreatePaymentCheckoutRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> VerifyPaymentAsync(Guid studentId, VerifyPaymentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CurriculumModuleResponse>> GetStudentCurriculumAsync(Guid studentId, CancellationToken cancellationToken);

    Task<LessonResponse> UpdateLessonProgressAsync(Guid studentId, Guid lessonId, UpdateLessonProgressRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<LiveClassResponse>> GetStudentLiveClassesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssignmentResponse>> GetStudentAssignmentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SubmissionResponse> SubmitAssignmentAsync(Guid studentId, Guid assignmentId, SubmitAssignmentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectResponse>> GetStudentProjectsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SubmissionResponse> SubmitProjectAsync(Guid studentId, Guid projectId, SubmitProjectRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssessmentResponse>> GetStudentAssessmentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<PaymentTransactionResponse>> GetStudentPaymentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CertificateResponse>> GetStudentCertificatesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<NotificationResponse>> GetStudentNotificationsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SupportTicketResponse> CreateSupportTicketAsync(Guid userId, CreateSupportTicketRequest request, CancellationToken cancellationToken);

    Task<AdminLmsSummaryResponse> GetAdminSummaryAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ProgramSummaryResponse>> GetAdminProgramsAsync(CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> CreateProgramAsync(CreateProgramRequest request, CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> UpdateProgramAsync(Guid programId, UpdateProgramRequest request, CancellationToken cancellationToken);

    Task<ProgramPlanResponse> CreateProgramPlanAsync(Guid programId, CreatePlanRequest request, CancellationToken cancellationToken);

    Task<PagedResult<SupportTicketResponse>> GetSupportTicketsAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<SupportTicketResponse> UpdateSupportTicketAsync(Guid ticketId, UpdateSupportTicketRequest request, CancellationToken cancellationToken);

    Task<MentorDashboardResponse> GetMentorDashboardAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<MentorReviewQueueResponse> GetMentorReviewQueueAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<SubmissionResponse> ReviewAssignmentSubmissionAsync(Guid mentorId, Guid submissionId, ReviewSubmissionRequest request, CancellationToken cancellationToken);

    Task<SubmissionResponse> ReviewProjectSubmissionAsync(Guid mentorId, Guid submissionId, ReviewSubmissionRequest request, CancellationToken cancellationToken);
}
