using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Lms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "MentorOnly")]
[Route("api/v1/mentor/lms")]
public sealed class MentorLmsController(
    ILmsPortalService lmsPortalService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<MentorDashboardResponse>>> GetDashboard(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetMentorDashboardAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<MentorDashboardResponse>.Ok(result, "Mentor dashboard loaded.", CorrelationId));
    }

    [HttpGet("review-queue")]
    public async Task<ActionResult<ApiResponse<MentorReviewQueueResponse>>> GetReviewQueue(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetMentorReviewQueueAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<MentorReviewQueueResponse>.Ok(result, "Mentor review queue loaded.", CorrelationId));
    }

    [HttpGet("learners")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MentorLearnerResponse>>>> GetLearners(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetMentorLearnersAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<MentorLearnerResponse>>.Ok(result, "Mentor learners loaded.", CorrelationId));
    }

    [HttpGet("live-classes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveClassResponse>>>> GetLiveClasses(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetMentorLiveClassesAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LiveClassResponse>>.Ok(result, "Mentor live classes loaded.", CorrelationId));
    }

    [HttpPost("live-classes")]
    public async Task<ActionResult<ApiResponse<LiveClassResponse>>> CreateLiveClass(
        CreateLiveClassRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateMentorLiveClassAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<LiveClassResponse>.Ok(result, "Live class created.", CorrelationId));
    }

    [HttpGet("assessments/review-queue")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssessmentAttemptResponse>>>> GetAssessmentReviewQueue(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetMentorAssessmentReviewQueueAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AssessmentAttemptResponse>>.Ok(result, "Assessment review queue loaded.", CorrelationId));
    }

    [HttpPost("assignment-submissions/{submissionId:guid}/feedback")]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> ReviewAssignmentSubmission(
        Guid submissionId,
        ReviewSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.ReviewAssignmentSubmissionAsync(RequiredUserId, submissionId, request, cancellationToken);
        return Ok(ApiResponse<SubmissionResponse>.Ok(result, "Assignment feedback saved.", CorrelationId));
    }

    [HttpPost("project-submissions/{submissionId:guid}/feedback")]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> ReviewProjectSubmission(
        Guid submissionId,
        ReviewSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.ReviewProjectSubmissionAsync(RequiredUserId, submissionId, request, cancellationToken);
        return Ok(ApiResponse<SubmissionResponse>.Ok(result, "Project feedback saved.", CorrelationId));
    }

    [HttpPost("assessment-attempts/{attemptId:guid}/feedback")]
    public async Task<ActionResult<ApiResponse<AssessmentAttemptResponse>>> ReviewAssessmentAttempt(
        Guid attemptId,
        SubmitAssessmentAttemptRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.ReviewAssessmentAttemptAsync(RequiredUserId, attemptId, request, cancellationToken);
        return Ok(ApiResponse<AssessmentAttemptResponse>.Ok(result, "Assessment feedback saved.", CorrelationId));
    }

    [HttpGet("support-requests")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SupportTicketResponse>>>> GetSupportRequests(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetMentorSupportRequestsAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<SupportTicketResponse>>.Ok(result, "Mentor support requests loaded.", CorrelationId));
    }

    [HttpPatch("support-requests/{ticketId:guid}")]
    public async Task<ActionResult<ApiResponse<SupportTicketResponse>>> UpdateSupportRequest(
        Guid ticketId,
        UpdateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.UpdateMentorSupportRequestAsync(RequiredUserId, ticketId, request, cancellationToken);
        return Ok(ApiResponse<SupportTicketResponse>.Ok(result, "Mentor support request updated.", CorrelationId));
    }
}
