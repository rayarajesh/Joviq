using Joviq.Lms.Domain.Common;

namespace Joviq.Lms.Domain.Entities;

public sealed class UserSession : AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public string RefreshTokenHash { get; set; } = string.Empty;

    public Guid RefreshTokenFamilyId { get; set; } = Guid.NewGuid();

    public string JwtId { get; set; } = string.Empty;

    public string? DeviceId { get; set; }

    public string? DeviceName { get; set; }

    public string? Browser { get; set; }

    public string? OperatingSystem { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTimeOffset? LastSeenAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public string? RevokedByIp { get; set; }

    public string? RevocationReason { get; set; }

    public Guid? ReplacedBySessionId { get; set; }

    public bool IsPersistent { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}
