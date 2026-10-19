using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Students;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/v1/admin/onboarding")]
public sealed class AdminOnboardingController(IAdminOnboardingService service, ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminOnboardingRecord>>>> List([FromQuery] AdminOnboardingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PagedResult<AdminOnboardingRecord>>.Ok(await service.ListAsync(request, cancellationToken), "Onboarding submissions loaded.", CorrelationId));

    [HttpGet("filters")]
    public async Task<ActionResult<ApiResponse<OnboardingFilterOptions>>> Filters(CancellationToken cancellationToken) =>
        Ok(ApiResponse<OnboardingFilterOptions>.Ok(await service.FiltersAsync(cancellationToken), "Filters loaded.", CorrelationId));

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<ApiResponse<AdminOnboardingRecord>>> Get(Guid userId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<AdminOnboardingRecord>.Ok(await service.GetAsync(userId, cancellationToken), "Onboarding details loaded.", CorrelationId));

    [HttpPut("{userId:guid}/status")]
    public async Task<ActionResult<ApiResponse<AdminOnboardingRecord>>> UpdateStatus(Guid userId, UpdateOnboardingStatusRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<AdminOnboardingRecord>.Ok(await service.UpdateStatusAsync(userId, request.Status, cancellationToken), "Review status saved.", CorrelationId));
}
