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

    [HttpGet("programs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProgramSummaryResponse>>>> GetPrograms(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminProgramsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProgramSummaryResponse>>.Ok(result, "Admin programs loaded.", CorrelationId));
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

    [HttpPost("modules/{moduleId:guid}/lessons")]
    public async Task<ActionResult<ApiResponse<LessonResponse>>> CreateLesson(
        Guid moduleId,
        CreateLessonRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateLessonAsync(moduleId, request, cancellationToken);
        return Ok(ApiResponse<LessonResponse>.Ok(result, "Lesson created.", CorrelationId));
    }

    [HttpGet("live-classes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveClassResponse>>>> GetLiveClasses(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminLiveClassesAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LiveClassResponse>>.Ok(result, "Live classes loaded.", CorrelationId));
    }

    [HttpPost("live-classes")]
    public async Task<ActionResult<ApiResponse<LiveClassResponse>>> CreateLiveClass(
        CreateLiveClassRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateLiveClassAsync(request, cancellationToken);
        return Ok(ApiResponse<LiveClassResponse>.Ok(result, "Live class created.", CorrelationId));
    }

    [HttpGet("assignments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssignmentResponse>>>> GetAssignments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminAssignmentsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AssignmentResponse>>.Ok(result, "Assignments loaded.", CorrelationId));
    }

    [HttpPost("assignments")]
    public async Task<ActionResult<ApiResponse<AssignmentResponse>>> CreateAssignment(
        CreateAssignmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateAssignmentAsync(request, cancellationToken);
        return Ok(ApiResponse<AssignmentResponse>.Ok(result, "Assignment created.", CorrelationId));
    }

    [HttpGet("projects")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectResponse>>>> GetProjects(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminProjectsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProjectResponse>>.Ok(result, "Projects loaded.", CorrelationId));
    }

    [HttpPost("projects")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> CreateProject(
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateProjectAsync(request, cancellationToken);
        return Ok(ApiResponse<ProjectResponse>.Ok(result, "Project created.", CorrelationId));
    }

    [HttpGet("assessments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssessmentResponse>>>> GetAssessments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminAssessmentsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AssessmentResponse>>.Ok(result, "Assessments loaded.", CorrelationId));
    }

    [HttpPost("assessments")]
    public async Task<ActionResult<ApiResponse<AssessmentResponse>>> CreateAssessment(
        CreateAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateAssessmentAsync(request, cancellationToken);
        return Ok(ApiResponse<AssessmentResponse>.Ok(result, "Assessment created.", CorrelationId));
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

    [HttpPost("refunds")]
    public async Task<ActionResult<ApiResponse<PaymentTransactionResponse>>> RefundPayment(
        [FromQuery] Guid paymentId,
        RefundPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.RefundPaymentAsync(paymentId, request, cancellationToken);
        return Ok(ApiResponse<PaymentTransactionResponse>.Ok(result, "Payment refunded.", CorrelationId));
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

    [HttpGet("support/tickets")]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketResponse>>>> GetSupportTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await lmsPortalService.GetSupportTicketsAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<SupportTicketResponse>>.Ok(result, "Support tickets loaded.", CorrelationId));
    }

    [HttpPatch("support/tickets/{ticketId:guid}")]
    public async Task<ActionResult<ApiResponse<SupportTicketResponse>>> UpdateSupportTicket(
        Guid ticketId,
        UpdateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateSupportTicketAsync(ticketId, request, cancellationToken);
        return Ok(ApiResponse<SupportTicketResponse>.Ok(result, "Support ticket updated.", CorrelationId));
    }

    [HttpGet("reports")]
    public async Task<ActionResult<ApiResponse<AdminReportResponse>>> GetReports(CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetAdminReportsAsync(cancellationToken);
        return Ok(ApiResponse<AdminReportResponse>.Ok(result, "Reports loaded.", CorrelationId));
    }
}
