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
}
