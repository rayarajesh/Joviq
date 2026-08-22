namespace Joviq.Lms.Domain.Enums;

public enum ProgramStatus
{
    Draft = 1,
    Published = 2,
    Archived = 3
}

public enum ContentAccessLevel
{
    Preview = 1,
    Reserved = 2,
    Full = 3
}

public enum EnrollmentStatus
{
    Reserved = 1,
    Active = 2,
    Completed = 3,
    Cancelled = 4
}

public enum PaymentMode
{
    ReserveSeat = 1,
    PayInFull = 2,
    RemainingBalance = 3
}

public enum PaymentStatus
{
    Pending = 1,
    Verified = 2,
    Failed = 3,
    Refunded = 4
}

public enum LiveClassStatus
{
    Scheduled = 1,
    Live = 2,
    Completed = 3,
    Cancelled = 4
}

public enum SubmissionStatus
{
    Draft = 1,
    Submitted = 2,
    NeedsRevision = 3,
    Approved = 4
}

public enum AssessmentAttemptStatus
{
    Started = 1,
    Submitted = 2,
    Evaluated = 3,
    Expired = 4
}

public enum CertificateType
{
    Training = 1,
    Internship = 2,
    Project = 3,
    Excellence = 4
}

public enum CertificateStatus
{
    Draft = 1,
    Issued = 2,
    Revoked = 3
}

public enum SupportTicketStatus
{
    Open = 1,
    InProgress = 2,
    WaitingForStudent = 3,
    Resolved = 4,
    Closed = 5
}

public enum LeadStatus
{
    New = 1,
    Contacted = 2,
    Qualified = 3,
    Converted = 4,
    Closed = 5
}

public enum NotificationStatus
{
    Unread = 1,
    Read = 2,
    Archived = 3
}
