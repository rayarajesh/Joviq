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

    [HttpPost("programs/{programId:guid}/plans")]
    public async Task<ActionResult<ApiResponse<ProgramPlanResponse>>> CreatePlan(
        Guid programId,
        CreatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateProgramPlanAsync(programId, request, cancellationToken);
        return Ok(ApiResponse<ProgramPlanResponse>.Ok(result, "Program plan created.", CorrelationId));
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
}
