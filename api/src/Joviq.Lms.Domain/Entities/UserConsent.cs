using Joviq.Lms.Domain.Common;

namespace Joviq.Lms.Domain.Entities;

public sealed class UserConsent : AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public string TermsVersion { get; set; } = string.Empty;

    public string PrivacyPolicyVersion { get; set; } = string.Empty;

    public DateTimeOffset AcceptedAt { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }
}
