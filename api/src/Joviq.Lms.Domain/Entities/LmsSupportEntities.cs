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
}

public sealed class SupportTicket : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public Guid? ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? StudentIdText { get; set; }

    public string Issue { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? AttachmentUrl { get; set; }

    public string Priority { get; set; } = "Normal";

    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

    public string? AdminNotes { get; set; }
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

public sealed class CampusAmbassadorApplication : AuditableEntity
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string College { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string WhyJoin { get; set; } = string.Empty;

    public LeadStatus Status { get; set; } = LeadStatus.New;
}

public sealed class CareerApplication : AuditableEntity
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? ResumeUrl { get; set; }

    public string? PortfolioUrl { get; set; }

    public string? CoverNote { get; set; }

    public LeadStatus Status { get; set; } = LeadStatus.New;
}
