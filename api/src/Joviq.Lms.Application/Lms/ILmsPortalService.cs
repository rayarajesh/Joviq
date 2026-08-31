using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Domain.Enums;

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

    Task<ProgramDetailsResponse> GetStudentMyProgramAsync(Guid studentId, CancellationToken cancellationToken);

    Task<EnrollmentResponse> CreateEnrollmentAsync(Guid studentId, CreateEnrollmentRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> CreatePaymentCheckoutAsync(Guid studentId, CreatePaymentCheckoutRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> VerifyPaymentAsync(Guid studentId, VerifyPaymentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CurriculumModuleResponse>> GetStudentCurriculumAsync(Guid studentId, CancellationToken cancellationToken);

    Task<LessonResponse> UpdateLessonProgressAsync(Guid studentId, Guid lessonId, UpdateLessonProgressRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<LiveClassResponse>> GetStudentLiveClassesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<RecordedClassResponse>> GetStudentRecordedClassesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssignmentResponse>> GetStudentAssignmentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SubmissionResponse> SubmitAssignmentAsync(Guid studentId, Guid assignmentId, SubmitAssignmentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectResponse>> GetStudentProjectsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SubmissionResponse> SubmitProjectAsync(Guid studentId, Guid projectId, SubmitProjectRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssessmentResponse>> GetStudentAssessmentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<AssessmentAttemptResponse> StartAssessmentAttemptAsync(Guid studentId, Guid assessmentId, CancellationToken cancellationToken);

    Task<AssessmentAttemptResponse> SubmitAssessmentAttemptAsync(Guid studentId, Guid attemptId, SubmitAssessmentAttemptRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssessmentResponse>> GetStudentAiAssessmentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<AssessmentAttemptResponse> StartAiAssessmentAttemptAsync(Guid studentId, Guid assessmentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<AiInterviewAttemptResponse>> GetStudentAiInterviewsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<AiInterviewAttemptResponse> StartAiInterviewAsync(Guid studentId, StartAiInterviewRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<SupportTicketResponse>> GetStudentMentorSupportAsync(Guid studentId, CancellationToken cancellationToken);

    Task<CareerSupportResponse> GetStudentCareerSupportAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SupportTicketResponse> CreateResumeReviewRequestAsync(Guid studentId, CreateSupportTicketRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<PaymentTransactionResponse>> GetStudentPaymentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CertificateResponse>> GetStudentCertificatesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<NotificationResponse>> GetStudentNotificationsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<NotificationResponse> MarkNotificationReadAsync(Guid studentId, Guid notificationId, CancellationToken cancellationToken);

    Task<SupportTicketResponse> CreateSupportTicketAsync(Guid userId, CreateSupportTicketRequest request, CancellationToken cancellationToken);

    Task<AdminLmsSummaryResponse> GetAdminSummaryAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ProgramCategoryResponse>> GetAdminCategoriesAsync(CancellationToken cancellationToken);

    Task<ProgramCategoryResponse> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken);

    Task<ProgramCategoryResponse> UpdateCategoryAsync(Guid categoryId, CreateCategoryRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProgramSummaryResponse>> GetAdminProgramsAsync(CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> GetAdminProgramAsync(Guid programId, CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> CreateProgramAsync(CreateProgramRequest request, CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> UpdateProgramAsync(Guid programId, UpdateProgramRequest request, CancellationToken cancellationToken);

    Task DeleteProgramAsync(Guid programId, CancellationToken cancellationToken);

    Task<ProgramPlanResponse> CreateProgramPlanAsync(Guid programId, CreatePlanRequest request, CancellationToken cancellationToken);

    Task<ProgramPlanResponse> UpdateProgramPlanAsync(Guid planId, CreatePlanRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CurriculumModuleResponse>> GetAdminCurriculumAsync(Guid? programId, CancellationToken cancellationToken);

    Task<CurriculumModuleResponse> CreateModuleAsync(Guid programId, CreateModuleRequest request, CancellationToken cancellationToken);

    Task<CurriculumModuleResponse> UpdateModuleAsync(Guid moduleId, CreateModuleRequest request, CancellationToken cancellationToken);

    Task<LessonResponse> CreateLessonAsync(Guid moduleId, CreateLessonRequest request, CancellationToken cancellationToken);

    Task<LessonResponse> UpdateLessonAsync(Guid lessonId, CreateLessonRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<LiveClassResponse>> GetAdminLiveClassesAsync(CancellationToken cancellationToken);

    Task<LiveClassResponse> CreateLiveClassAsync(CreateLiveClassRequest request, CancellationToken cancellationToken);

    Task<LiveClassResponse> UpdateLiveClassAsync(Guid liveClassId, CreateLiveClassRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssignmentResponse>> GetAdminAssignmentsAsync(CancellationToken cancellationToken);

    Task<AssignmentResponse> CreateAssignmentAsync(CreateAssignmentRequest request, CancellationToken cancellationToken);

    Task<AssignmentResponse> UpdateAssignmentAsync(Guid assignmentId, CreateAssignmentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectResponse>> GetAdminProjectsAsync(CancellationToken cancellationToken);

    Task<ProjectResponse> CreateProjectAsync(CreateProjectRequest request, CancellationToken cancellationToken);

    Task<ProjectResponse> UpdateProjectAsync(Guid projectId, CreateProjectRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssessmentResponse>> GetAdminAssessmentsAsync(CancellationToken cancellationToken);

    Task<AssessmentResponse> CreateAssessmentAsync(CreateAssessmentRequest request, CancellationToken cancellationToken);

    Task<AssessmentResponse> UpdateAssessmentAsync(Guid assessmentId, CreateAssessmentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<EnrollmentResponse>> GetAdminEnrollmentsAsync(CancellationToken cancellationToken);

    Task<EnrollmentResponse> UpdateEnrollmentStatusAsync(Guid enrollmentId, UpdateEnrollmentStatusRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<PaymentTransactionResponse>> GetAdminPaymentsAsync(CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> UpdatePaymentStatusAsync(Guid paymentId, UpdatePaymentStatusRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> RefundPaymentAsync(Guid paymentId, RefundPaymentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<PaymentTransactionResponse>> GetAdminRefundsAsync(CancellationToken cancellationToken);

    Task<AdminAiFeatureSummaryResponse> GetAdminAiFeaturesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<CouponResponse>> GetCouponsAsync(CancellationToken cancellationToken);

    Task<CouponResponse> CreateCouponAsync(CreateCouponRequest request, CancellationToken cancellationToken);

    Task<CouponResponse> UpdateCouponAsync(Guid couponId, CreateCouponRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CertificateResponse>> GetAdminCertificatesAsync(CancellationToken cancellationToken);

    Task<CertificateResponse> IssueCertificateAsync(IssueCertificateRequest request, CancellationToken cancellationToken);

    Task<CertificateResponse> UpdateCertificateStatusAsync(Guid certificateId, UpdateCertificateStatusRequest request, CancellationToken cancellationToken);

    Task<PagedResult<SupportTicketResponse>> GetSupportTicketsAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<SupportTicketResponse> UpdateSupportTicketAsync(Guid ticketId, UpdateSupportTicketRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminContentItemResponse>> GetAdminContentAsync(AdminContentType? contentType, CancellationToken cancellationToken);

    Task<AdminContentItemResponse> CreateAdminContentAsync(CreateAdminContentItemRequest request, CancellationToken cancellationToken);

    Task<AdminContentItemResponse> UpdateAdminContentAsync(Guid contentId, CreateAdminContentItemRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminLeadResponse>> GetAdminLeadsAsync(string? leadType, CancellationToken cancellationToken);

    Task<AdminLeadResponse> UpdateAdminLeadStatusAsync(string leadType, Guid leadId, UpdateLeadStatusRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminNotificationResponse>> GetAdminNotificationsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminNotificationResponse>> CreateAdminNotificationAsync(CreateAdminNotificationRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminSettingResponse>> GetAdminSettingsAsync(string? category, CancellationToken cancellationToken);

    Task<AdminSettingResponse> UpsertAdminSettingAsync(string category, string key, UpsertAdminSettingRequest request, CancellationToken cancellationToken);

    Task<MentorDashboardResponse> GetMentorDashboardAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MentorLearnerResponse>> GetMentorLearnersAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<IReadOnlyList<LiveClassResponse>> GetMentorLiveClassesAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<LiveClassResponse> CreateMentorLiveClassAsync(Guid mentorId, CreateLiveClassRequest request, CancellationToken cancellationToken);

    Task<MentorReviewQueueResponse> GetMentorReviewQueueAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<SubmissionResponse> ReviewAssignmentSubmissionAsync(Guid mentorId, Guid submissionId, ReviewSubmissionRequest request, CancellationToken cancellationToken);

    Task<SubmissionResponse> ReviewProjectSubmissionAsync(Guid mentorId, Guid submissionId, ReviewSubmissionRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AssessmentAttemptResponse>> GetMentorAssessmentReviewQueueAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<AssessmentAttemptResponse> ReviewAssessmentAttemptAsync(Guid mentorId, Guid attemptId, SubmitAssessmentAttemptRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<SupportTicketResponse>> GetMentorSupportRequestsAsync(Guid mentorId, CancellationToken cancellationToken);

    Task<SupportTicketResponse> UpdateMentorSupportRequestAsync(Guid mentorId, Guid ticketId, UpdateSupportTicketRequest request, CancellationToken cancellationToken);

    Task<AdminReportResponse> GetAdminReportsAsync(CancellationToken cancellationToken);
}
