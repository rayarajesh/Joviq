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
    Failed = 3
}

public enum SubmissionStatus
{
    Draft = 1,
    Submitted = 2,
    NeedsRevision = 3,
    Approved = 4
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

public enum AssetType
{
    Image = 1,
    Video = 2,
    Document = 3,
    Other = 4
}

public enum AssetPurpose
{
    General = 1,
    ProgramThumbnail = 2,
    LessonVideo = 3,
    LessonResource = 4,
    ProjectSubmission = 6,
    UserProfile = 8
}

public enum AssetVisibility
{
    Public = 1,
    Private = 2
}

public enum AssetStatus
{
    PendingUpload = 1,
    Ready = 2,
    Deleted = 3
}
