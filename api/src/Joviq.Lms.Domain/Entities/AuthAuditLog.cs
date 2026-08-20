using Joviq.Lms.Domain.Common;

namespace Joviq.Lms.Domain.Entities;

public sealed class AuthAuditLog : AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? UserId { get; set; }

    public string EventType { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? MetadataJson { get; set; }
}
