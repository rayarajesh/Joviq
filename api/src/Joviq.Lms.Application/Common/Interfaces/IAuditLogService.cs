using Joviq.Lms.Application.Common.Models;

namespace Joviq.Lms.Application.Common.Interfaces;

public interface IAuditLogService
{
    void Add(string eventType, object? metadata = null, Guid? userId = null, string? email = null, string? phone = null);

    Task<PagedResult<AuditLogResponse>> GetAuditLogsAsync(AuditLogListRequest request, CancellationToken cancellationToken);

    Task<int> PurgeExpiredAsync(int retentionDays, CancellationToken cancellationToken);
}

public sealed class AuditLogListRequest
{
    public string? Search { get; init; }

    public string? EventType { get; init; }

    public Guid? UserId { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}

public sealed record AuditLogResponse(
    Guid Id,
    Guid? UserId,
    string EventType,
    string? Email,
    string? Phone,
    string? IpAddress,
    string? UserAgent,
    string? MetadataJson,
    DateTimeOffset CreatedAt);
