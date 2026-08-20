using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase(ICurrentUserService currentUser) : ControllerBase
{
    protected Guid RequiredUserId =>
        currentUser.UserId ?? throw new AppException("Authentication is required.", 401, "unauthorized");

    protected Guid? CurrentSessionId => currentUser.SessionId;

    protected string CorrelationId => HttpContext.TraceIdentifier;

    protected RequestMetadata RequestMetadata(string? deviceName = null)
    {
        return new RequestMetadata(
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            deviceName,
            Request.Headers["X-Device-Id"].ToString());
    }
}
