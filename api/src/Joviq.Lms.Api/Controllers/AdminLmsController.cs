using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Lms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/v1/admin/lms")]
public sealed class AdminLmsController(
    ILmsPortalService lmsPortalService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<AdminLmsSummaryResponse>>> GetSummary(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminSummaryAsync(cancellationToken);
        return Ok(ApiResponse<AdminLmsSummaryResponse>.Ok(result, "LMS summary loaded.", CorrelationId));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProgramCategoryResponse>>>> GetCategories(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminCategoriesAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProgramCategoryResponse>>.Ok(result, "Admin categories loaded.", CorrelationId));
    }

    [HttpPost("categories")]
    public async Task<ActionResult<ApiResponse<ProgramCategoryResponse>>> CreateCategory(
        CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateCategoryAsync(request, cancellationToken);
        return Ok(ApiResponse<ProgramCategoryResponse>.Ok(result, "Program category created.", CorrelationId));
    }

    [HttpPut("categories/{categoryId:guid}")]
    public async Task<ActionResult<ApiResponse<ProgramCategoryResponse>>> UpdateCategory(
        Guid categoryId,
        CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateCategoryAsync(categoryId, request, cancellationToken);
        return Ok(ApiResponse<ProgramCategoryResponse>.Ok(result, "Program category updated.", CorrelationId));
    }

    [HttpGet("programs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProgramSummaryResponse>>>> GetPrograms(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminProgramsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProgramSummaryResponse>>.Ok(result, "Admin programs loaded.", CorrelationId));
    }

    [HttpGet("programs/{programId:guid}")]
    public async Task<ActionResult<ApiResponse<ProgramDetailsResponse>>> GetProgram(
        Guid programId,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminProgramAsync(programId, cancellationToken);
        return Ok(ApiResponse<ProgramDetailsResponse>.Ok(result, "Admin program loaded.", CorrelationId));
    }

    [HttpPost("programs")]
    public async Task<ActionResult<ApiResponse<ProgramDetailsResponse>>> CreateProgram(
        CreateProgramRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateProgramAsync(request, cancellationToken);
        return Ok(ApiResponse<ProgramDetailsResponse>.Ok(result, "Program created.", CorrelationId));
    }

    [HttpPut("programs/{programId:guid}")]
    public async Task<ActionResult<ApiResponse<ProgramDetailsResponse>>> UpdateProgram(
        Guid programId,
        UpdateProgramRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateProgramAsync(programId, request, cancellationToken);
        return Ok(ApiResponse<ProgramDetailsResponse>.Ok(result, "Program updated.", CorrelationId));
    }

    [HttpDelete("programs/{programId:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteProgram(
        Guid programId,
        CancellationToken cancellationToken)
    {
        await lmsPortalService.DeleteProgramAsync(programId, cancellationToken);
        return Ok(ApiResponse.Ok("Program archived.", CorrelationId));
    }

    [HttpPost("programs/{programId:guid}/plans")]
    public async Task<ActionResult<ApiResponse<ProgramPlanResponse>>> CreatePlan(
        Guid programId,
        CreatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateProgramPlanAsync(programId, request, cancellationToken);
        return Ok(ApiResponse<ProgramPlanResponse>.Ok(result, "Program plan created.", CorrelationId));
    }

    [HttpPut("plans/{planId:guid}")]
    public async Task<ActionResult<ApiResponse<ProgramPlanResponse>>> UpdatePlan(
        Guid planId,
        CreatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateProgramPlanAsync(planId, request, cancellationToken);
        return Ok(ApiResponse<ProgramPlanResponse>.Ok(result, "Program plan updated.", CorrelationId));
    }

    [HttpGet("curriculum")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CurriculumModuleResponse>>>> GetCurriculum(
        [FromQuery] Guid? programId,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminCurriculumAsync(programId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CurriculumModuleResponse>>.Ok(result, "Curriculum loaded.", CorrelationId));
    }

    [HttpPost("programs/{programId:guid}/modules")]
    public async Task<ActionResult<ApiResponse<CurriculumModuleResponse>>> CreateModule(
        Guid programId,
        CreateModuleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateModuleAsync(programId, request, cancellationToken);
        return Ok(ApiResponse<CurriculumModuleResponse>.Ok(result, "Curriculum module created.", CorrelationId));
    }

    [HttpPut("modules/{moduleId:guid}")]
    public async Task<ActionResult<ApiResponse<CurriculumModuleResponse>>> UpdateModule(
        Guid moduleId,
        CreateModuleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateModuleAsync(moduleId, request, cancellationToken);
        return Ok(ApiResponse<CurriculumModuleResponse>.Ok(result, "Curriculum module updated.", CorrelationId));
    }

    [HttpDelete("modules/{moduleId:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteModule(
        Guid moduleId,
        CancellationToken cancellationToken)
    {
        await lmsPortalService.DeleteModuleAsync(moduleId, cancellationToken);
        return Ok(ApiResponse.Ok("Curriculum module deleted.", CorrelationId));
    }

    [HttpPut("programs/{programId:guid}/modules/order")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CurriculumModuleResponse>>>> ReorderModules(
        Guid programId,
        ReorderItemsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.ReorderModulesAsync(programId, request, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CurriculumModuleResponse>>.Ok(result, "Curriculum order updated.", CorrelationId));
    }

    [HttpPost("modules/{moduleId:guid}/lessons")]
    public async Task<ActionResult<ApiResponse<LessonResponse>>> CreateLesson(
        Guid moduleId,
        CreateLessonRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateLessonAsync(moduleId, request, cancellationToken);
        return Ok(ApiResponse<LessonResponse>.Ok(result, "Lesson created.", CorrelationId));
    }

    [HttpPut("lessons/{lessonId:guid}")]
    public async Task<ActionResult<ApiResponse<LessonResponse>>> UpdateLesson(
        Guid lessonId,
        CreateLessonRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateLessonAsync(lessonId, request, cancellationToken);
        return Ok(ApiResponse<LessonResponse>.Ok(result, "Lesson updated.", CorrelationId));
    }

    [HttpDelete("lessons/{lessonId:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteLesson(
        Guid lessonId,
        CancellationToken cancellationToken)
    {
        await lmsPortalService.DeleteLessonAsync(lessonId, cancellationToken);
        return Ok(ApiResponse.Ok("Lesson deleted.", CorrelationId));
    }

    [HttpPut("modules/{moduleId:guid}/lessons/order")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CurriculumModuleResponse>>>> ReorderLessons(
        Guid moduleId,
        ReorderItemsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.ReorderLessonsAsync(moduleId, request, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CurriculumModuleResponse>>.Ok(result, "Lesson order updated.", CorrelationId));
    }

    [HttpGet("projects")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectResponse>>>> GetProjects(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminProjectsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProjectResponse>>.Ok(result, "Projects loaded.", CorrelationId));
    }

    [HttpGet("project-submissions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectSubmissionReviewResponse>>>> GetProjectSubmissions(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminProjectSubmissionsAsync(projectId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProjectSubmissionReviewResponse>>.Ok(result, "Project submissions loaded.", CorrelationId));
    }

    [HttpPatch("project-submissions/{submissionId:guid}")]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> ReviewProjectSubmission(
        Guid submissionId,
        ReviewProjectSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.ReviewProjectSubmissionAsync(submissionId, request, cancellationToken);
        return Ok(ApiResponse<SubmissionResponse>.Ok(result, "Project submission reviewed.", CorrelationId));
    }

    [HttpPost("projects")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> CreateProject(
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateProjectAsync(request, cancellationToken);
        return Ok(ApiResponse<ProjectResponse>.Ok(result, "Project created.", CorrelationId));
    }

    [HttpPut("projects/{projectId:guid}")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> UpdateProject(
        Guid projectId,
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateProjectAsync(projectId, request, cancellationToken);
        return Ok(ApiResponse<ProjectResponse>.Ok(result, "Project updated.", CorrelationId));
    }

    [HttpDelete("projects/{projectId:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteProject(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        await lmsPortalService.DeleteProjectAsync(projectId, cancellationToken);
        return Ok(ApiResponse.Ok("Project deleted.", CorrelationId));
    }

    [HttpGet("programs/{programId:guid}/active-students")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectStudentResponse>>>> GetProjectStudents(
        Guid programId,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetProjectStudentsAsync(programId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProjectStudentResponse>>.Ok(result, "Active program students loaded.", CorrelationId));
    }

    [HttpPost("projects/{projectId:guid}/publish")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> PublishProject(
        Guid projectId,
        PublishProjectRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.PublishProjectAsync(projectId, request, cancellationToken);
        return Ok(ApiResponse<ProjectResponse>.Ok(result, "Project published to selected students.", CorrelationId));
    }

    [HttpGet("enrollments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EnrollmentResponse>>>> GetEnrollments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminEnrollmentsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EnrollmentResponse>>.Ok(result, "Enrollments loaded.", CorrelationId));
    }

    [HttpPatch("enrollments/{enrollmentId:guid}/status")]
    public async Task<ActionResult<ApiResponse<EnrollmentResponse>>> UpdateEnrollmentStatus(
        Guid enrollmentId,
        UpdateEnrollmentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateEnrollmentStatusAsync(enrollmentId, request, cancellationToken);
        return Ok(ApiResponse<EnrollmentResponse>.Ok(result, "Enrollment updated.", CorrelationId));
    }

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PaymentTransactionResponse>>>> GetPayments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminPaymentsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PaymentTransactionResponse>>.Ok(result, "Payments loaded.", CorrelationId));
    }

    [HttpPatch("payments/{paymentId:guid}/verify")]
    public async Task<ActionResult<ApiResponse<PaymentTransactionResponse>>> VerifyPayment(
        Guid paymentId,
        UpdatePaymentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdatePaymentStatusAsync(paymentId, request, cancellationToken);
        return Ok(ApiResponse<PaymentTransactionResponse>.Ok(result, "Payment updated.", CorrelationId));
    }

    [HttpGet("payments/{paymentId:guid}/receipt")]
    public async Task<ActionResult<ApiResponse<PaymentReceiptResponse>>> GetPaymentReceipt(
        Guid paymentId,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminPaymentReceiptAsync(paymentId, cancellationToken);
        return Ok(ApiResponse<PaymentReceiptResponse>.Ok(result, "Payment receipt loaded.", CorrelationId));
    }

    [HttpGet("coupons")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CouponResponse>>>> GetCoupons(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetCouponsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CouponResponse>>.Ok(result, "Coupons loaded.", CorrelationId));
    }

    [HttpPost("coupons")]
    public async Task<ActionResult<ApiResponse<CouponResponse>>> CreateCoupon(
        CreateCouponRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateCouponAsync(request, cancellationToken);
        return Ok(ApiResponse<CouponResponse>.Ok(result, "Coupon created.", CorrelationId));
    }

    [HttpPut("coupons/{couponId:guid}")]
    public async Task<ActionResult<ApiResponse<CouponResponse>>> UpdateCoupon(
        Guid couponId,
        CreateCouponRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateCouponAsync(couponId, request, cancellationToken);
        return Ok(ApiResponse<CouponResponse>.Ok(result, "Coupon updated.", CorrelationId));
    }

    [HttpGet("certificates")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CertificateResponse>>>> GetCertificates(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminCertificatesAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CertificateResponse>>.Ok(result, "Certificates loaded.", CorrelationId));
    }

    [HttpPost("certificates/issue")]
    public async Task<ActionResult<ApiResponse<CertificateResponse>>> IssueCertificate(
        IssueCertificateRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.IssueCertificateAsync(request, cancellationToken);
        return Ok(ApiResponse<CertificateResponse>.Ok(result, "Certificate issued.", CorrelationId));
    }

    [HttpPatch("certificates/{certificateId:guid}/status")]
    public async Task<ActionResult<ApiResponse<CertificateResponse>>> UpdateCertificateStatus(
        Guid certificateId,
        UpdateCertificateStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateCertificateStatusAsync(certificateId, request, cancellationToken);
        return Ok(ApiResponse<CertificateResponse>.Ok(result, "Certificate status updated.", CorrelationId));
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminNotificationResponse>>>> GetNotifications(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminNotificationsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AdminNotificationResponse>>.Ok(result, "Notifications loaded.", CorrelationId));
    }

    [HttpPost("notifications")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminNotificationResponse>>>> CreateNotification(
        CreateAdminNotificationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateAdminNotificationAsync(request, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AdminNotificationResponse>>.Ok(result, "Notification sent.", CorrelationId));
    }

}
