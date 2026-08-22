using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Lms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "StudentOnly")]
[Route("api/v1/student/lms")]
public sealed class StudentLmsController(
    ILmsPortalService lmsPortalService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<StudentLmsDashboardResponse>>> GetDashboard(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentDashboardAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<StudentLmsDashboardResponse>.Ok(result, "Student LMS dashboard loaded.", CorrelationId));
    }

    [HttpGet("workspace")]
    public async Task<ActionResult<ApiResponse<StudentProgramWorkspaceResponse>>> GetWorkspace(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentWorkspaceAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<StudentProgramWorkspaceResponse>.Ok(result, "Student LMS workspace loaded.", CorrelationId));
    }

    [HttpPost("enrollments")]
    public async Task<ActionResult<ApiResponse<EnrollmentResponse>>> CreateEnrollment(
        CreateEnrollmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateEnrollmentAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<EnrollmentResponse>.Ok(result, "Enrollment created.", CorrelationId));
    }

    [HttpPost("payments/checkout")]
    public async Task<ActionResult<ApiResponse<PaymentTransactionResponse>>> CreatePaymentCheckout(
        CreatePaymentCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreatePaymentCheckoutAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<PaymentTransactionResponse>.Ok(result, "Payment checkout created.", CorrelationId));
    }

    [HttpPost("payments/verify")]
    public async Task<ActionResult<ApiResponse<PaymentTransactionResponse>>> VerifyPayment(
        VerifyPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.VerifyPaymentAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<PaymentTransactionResponse>.Ok(result, "Payment verified.", CorrelationId));
    }

    [HttpGet("curriculum")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CurriculumModuleResponse>>>> GetCurriculum(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentCurriculumAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CurriculumModuleResponse>>.Ok(result, "Curriculum loaded.", CorrelationId));
    }

    [HttpPost("lessons/{lessonId:guid}/progress")]
    public async Task<ActionResult<ApiResponse<LessonResponse>>> UpdateLessonProgress(
        Guid lessonId,
        UpdateLessonProgressRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateLessonProgressAsync(RequiredUserId, lessonId, request, cancellationToken);
        return Ok(ApiResponse<LessonResponse>.Ok(result, "Lesson progress saved.", CorrelationId));
    }

    [HttpGet("live-classes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveClassResponse>>>> GetLiveClasses(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentLiveClassesAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LiveClassResponse>>.Ok(result, "Live classes loaded.", CorrelationId));
    }

    [HttpGet("assignments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssignmentResponse>>>> GetAssignments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentAssignmentsAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AssignmentResponse>>.Ok(result, "Assignments loaded.", CorrelationId));
    }

    [HttpPost("assignments/{assignmentId:guid}/submit")]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> SubmitAssignment(
        Guid assignmentId,
        SubmitAssignmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.SubmitAssignmentAsync(RequiredUserId, assignmentId, request, cancellationToken);
        return Ok(ApiResponse<SubmissionResponse>.Ok(result, "Assignment submitted.", CorrelationId));
    }

    [HttpGet("projects")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectResponse>>>> GetProjects(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentProjectsAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProjectResponse>>.Ok(result, "Projects loaded.", CorrelationId));
    }

    [HttpPost("projects/{projectId:guid}/submit")]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> SubmitProject(
        Guid projectId,
        SubmitProjectRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.SubmitProjectAsync(RequiredUserId, projectId, request, cancellationToken);
        return Ok(ApiResponse<SubmissionResponse>.Ok(result, "Project submitted.", CorrelationId));
    }

    [HttpGet("assessments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssessmentResponse>>>> GetAssessments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentAssessmentsAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AssessmentResponse>>.Ok(result, "Assessments loaded.", CorrelationId));
    }

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PaymentTransactionResponse>>>> GetPayments(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentPaymentsAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PaymentTransactionResponse>>.Ok(result, "Payments loaded.", CorrelationId));
    }

    [HttpGet("certificates")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CertificateResponse>>>> GetCertificates(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentCertificatesAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CertificateResponse>>.Ok(result, "Certificates loaded.", CorrelationId));
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationResponse>>>> GetNotifications(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetStudentNotificationsAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationResponse>>.Ok(result, "Notifications loaded.", CorrelationId));
    }

    [HttpPost("support/tickets")]
    public async Task<ActionResult<ApiResponse<SupportTicketResponse>>> CreateSupportTicket(
        CreateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateSupportTicketAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<SupportTicketResponse>.Ok(result, "Support ticket created.", CorrelationId));
    }
}
