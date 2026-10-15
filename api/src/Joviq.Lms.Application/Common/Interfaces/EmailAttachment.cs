namespace Joviq.Lms.Application.Common.Interfaces;

public sealed record EmailAttachment(
    string FileName,
    string ContentType,
    byte[] Content);
