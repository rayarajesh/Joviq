using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class UserOtp : AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? UserId { get; set; }

    public string Destination { get; set; } = string.Empty;

    public OtpDestinationType DestinationType { get; set; }

    public OtpPurpose Purpose { get; set; }

    public string CodeHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ConsumedAt { get; set; }

    public int AttemptCount { get; set; }

    public int MaxAttempts { get; set; }

    public int ResendCount { get; set; }

    public string? CreatedIp { get; set; }

    public bool IsUsable(DateTimeOffset now) =>
        ConsumedAt is null && ExpiresAt > now && AttemptCount < MaxAttempts;
}
