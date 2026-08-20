namespace Joviq.Lms.Application.Common.Models;

public sealed record RequestMetadata(
    string? IpAddress,
    string? UserAgent,
    string? DeviceName,
    string? DeviceId);
