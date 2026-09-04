using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Lms;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[ApiController]
[Route("api/v1/public")]
public sealed class PublicPortalController(ILmsPortalService lmsPortalService) : ControllerBase
{
    private string CorrelationId => HttpContext.TraceIdentifier;

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProgramCategoryResponse>>>> GetCategories(
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetCategoriesAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ProgramCategoryResponse>>.Ok(result, "Program categories loaded.", CorrelationId));
    }

    [HttpGet("programs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProgramSummaryResponse>>>> GetPrograms(
        [FromQuery] ProgramListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetProgramsAsync(
            new ProgramListRequest
            {
                Search = request.Search,
                CategorySlug = request.CategorySlug,
                IncludeDrafts = false
            },
            cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<ProgramSummaryResponse>>.Ok(result, "Programs loaded.", CorrelationId));
    }

    [HttpGet("programs/{slug}")]
    public async Task<ActionResult<ApiResponse<ProgramDetailsResponse>>> GetProgram(
        string slug,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.GetProgramBySlugAsync(slug, cancellationToken);
        return Ok(ApiResponse<ProgramDetailsResponse>.Ok(result, "Program loaded.", CorrelationId));
    }

    [HttpPost("callback-requests")]
    public async Task<ActionResult<ApiResponse<LeadCaptureResponse>>> CreateCallbackRequest(
        CallbackRequestCreateRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateCallbackRequestAsync(request, cancellationToken);
        return Ok(ApiResponse<LeadCaptureResponse>.Ok(result, "Callback request received.", CorrelationId));
    }

    [HttpPost("enquiries")]
    public async Task<ActionResult<ApiResponse<LeadCaptureResponse>>> CreateEnquiry(
        EnquiryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.CreateEnquiryAsync(request, cancellationToken);
        return Ok(ApiResponse<LeadCaptureResponse>.Ok(result, "Enquiry received.", CorrelationId));
    }

    [HttpGet("certificates/verify/{certificateId}")]
    public async Task<ActionResult<ApiResponse<CertificateVerificationResponse>>> VerifyCertificate(
        string certificateId,
        CancellationToken cancellationToken)
    {
        var result = await lmsPortalService.VerifyCertificateAsync(certificateId, cancellationToken);
        return Ok(ApiResponse<CertificateVerificationResponse>.Ok(result, "Certificate verification loaded.", CorrelationId));
    }
}
