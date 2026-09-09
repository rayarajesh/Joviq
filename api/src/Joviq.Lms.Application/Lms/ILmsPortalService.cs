using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Application.Lms;

public interface ILmsPortalService
{
    Task<IReadOnlyList<ProgramCategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ProgramSummaryResponse>> GetProgramsAsync(ProgramListRequest request, CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> GetProgramBySlugAsync(string slug, CancellationToken cancellationToken);

    Task<LeadCaptureResponse> CreateCallbackRequestAsync(CallbackRequestCreateRequest request, CancellationToken cancellationToken);

    Task<LeadCaptureResponse> CreateEnquiryAsync(EnquiryCreateRequest request, CancellationToken cancellationToken);

    Task<CertificateVerificationResponse> VerifyCertificateAsync(string certificateId, CancellationToken cancellationToken);

    Task<StudentLmsDashboardResponse> GetStudentDashboardAsync(Guid studentId, CancellationToken cancellationToken);

    Task<StudentProgramWorkspaceResponse> GetStudentWorkspaceAsync(Guid studentId, CancellationToken cancellationToken);

    Task<ProgramDetailsResponse> GetStudentMyProgramAsync(Guid studentId, CancellationToken cancellationToken);

    Task<EnrollmentResponse> CreateEnrollmentAsync(Guid studentId, CreateEnrollmentRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> CreatePaymentCheckoutAsync(Guid studentId, CreatePaymentCheckoutRequest request, CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> VerifyPaymentAsync(Guid studentId, VerifyPaymentRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectResponse>> GetStudentProjectsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SubmissionResponse> SubmitProjectAsync(Guid studentId, Guid projectId, SubmitProjectRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<PaymentTransactionResponse>> GetStudentPaymentsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CertificateResponse>> GetStudentCertificatesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<NotificationResponse>> GetStudentNotificationsAsync(Guid studentId, CancellationToken cancellationToken);

    Task<NotificationResponse> MarkNotificationReadAsync(Guid studentId, Guid notificationId, CancellationToken cancellationToken);

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

    Task DeleteModuleAsync(Guid moduleId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CurriculumModuleResponse>> ReorderModulesAsync(Guid programId, ReorderItemsRequest request, CancellationToken cancellationToken);

    Task<LessonResponse> CreateLessonAsync(Guid moduleId, CreateLessonRequest request, CancellationToken cancellationToken);

    Task<LessonResponse> UpdateLessonAsync(Guid lessonId, CreateLessonRequest request, CancellationToken cancellationToken);

    Task DeleteLessonAsync(Guid lessonId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CurriculumModuleResponse>> ReorderLessonsAsync(Guid moduleId, ReorderItemsRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ProjectResponse>> GetAdminProjectsAsync(CancellationToken cancellationToken);

    Task<ProjectResponse> CreateProjectAsync(CreateProjectRequest request, CancellationToken cancellationToken);

    Task<ProjectResponse> UpdateProjectAsync(Guid projectId, CreateProjectRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<EnrollmentResponse>> GetAdminEnrollmentsAsync(CancellationToken cancellationToken);

    Task<EnrollmentResponse> UpdateEnrollmentStatusAsync(Guid enrollmentId, UpdateEnrollmentStatusRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<PaymentTransactionResponse>> GetAdminPaymentsAsync(CancellationToken cancellationToken);

    Task<PaymentTransactionResponse> UpdatePaymentStatusAsync(Guid paymentId, UpdatePaymentStatusRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CouponResponse>> GetCouponsAsync(CancellationToken cancellationToken);

    Task<CouponResponse> CreateCouponAsync(CreateCouponRequest request, CancellationToken cancellationToken);

    Task<CouponResponse> UpdateCouponAsync(Guid couponId, CreateCouponRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CertificateResponse>> GetAdminCertificatesAsync(CancellationToken cancellationToken);

    Task<CertificateResponse> IssueCertificateAsync(IssueCertificateRequest request, CancellationToken cancellationToken);

    Task<CertificateResponse> UpdateCertificateStatusAsync(Guid certificateId, UpdateCertificateStatusRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminNotificationResponse>> GetAdminNotificationsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminNotificationResponse>> CreateAdminNotificationAsync(CreateAdminNotificationRequest request, CancellationToken cancellationToken);

}
