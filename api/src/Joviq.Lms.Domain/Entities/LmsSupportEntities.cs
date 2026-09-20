using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class Certificate : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Enrollment? Enrollment { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public CertificateType Type { get; set; } = CertificateType.Training;

    public CertificateStatus Status { get; set; } = CertificateStatus.Draft;

    public string CertificateId { get; set; } = string.Empty;

    public DateTimeOffset? IssuedAt { get; set; }

    public string VerificationSlug { get; set; } = string.Empty;

    public string? VerificationUrl { get; set; }

    public string? QrCodeUrl { get; set; }

    public string? AuthorizedSignatory { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }

    public string? SignatureText { get; set; }
}

public sealed class Notification : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string? ActionUrl { get; set; }

    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;

    public DateTimeOffset? ReadAt { get; set; }
}

public sealed class CallbackRequest : AuditableEntity
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string? InterestedProgram { get; set; }

    public LeadStatus Status { get; set; } = LeadStatus.New;

    public string? Notes { get; set; }
}

public sealed class Enquiry : AuditableEntity
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Topic { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public LeadStatus Status { get; set; } = LeadStatus.New;
}
