using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/v1/admin/audit-logs")]
public sealed class AdminAuditLogsController(
    IAuditLogService auditLogService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditLogResponse>>>> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? eventType,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await auditLogService.GetAuditLogsAsync(
            new AuditLogListRequest
            {
                Search = search,
                EventType = eventType,
                UserId = userId,
                Page = page,
                PageSize = pageSize
            },
            cancellationToken);

        return Ok(ApiResponse<PagedResult<AuditLogResponse>>.Ok(result, "Audit logs loaded.", CorrelationId));
    }
}
