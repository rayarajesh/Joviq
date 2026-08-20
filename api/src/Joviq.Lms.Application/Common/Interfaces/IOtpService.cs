using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Application.Common.Interfaces;

public interface IOtpService
{
    Task<string> CreateOtpAsync(
        Guid? userId,
        string destination,
        OtpDestinationType destinationType,
        OtpPurpose purpose,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task VerifyOtpAsync(
        string destination,
        OtpPurpose purpose,
        string code,
        CancellationToken cancellationToken);
}
