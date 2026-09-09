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

    protected RequestMetadata RequestMetadata(string? deviceName = null, string? deviceId = null)
    {
        var requestDeviceId = Request.Headers["X-Device-Id"].ToString();
        var resolvedDeviceId = string.IsNullOrWhiteSpace(deviceId) ? requestDeviceId : deviceId;
        resolvedDeviceId = NormalizeDeviceId(resolvedDeviceId);

        return new RequestMetadata(
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            deviceName,
            resolvedDeviceId);
    }

    private static string? NormalizeDeviceId(string? deviceId)
    {
        var normalized = deviceId?.Trim();
        return string.IsNullOrWhiteSpace(normalized) || normalized.Length > 128 ? null : normalized;
    }
}
