using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class OtpService(
    ApplicationDbContext dbContext,
    IDateTimeProvider clock,
    IOptions<OtpOptions> options) : IOtpService
{
    private readonly OtpOptions _options = options.Value;

    public async Task<string> CreateOtpAsync(
        Guid? userId,
        string destination,
        OtpDestinationType destinationType,
        OtpPurpose purpose,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var normalizedDestination = NormalizeDestination(destination, destinationType);
        var since = clock.UtcNow.AddHours(-1);
        var recentCount = await dbContext.UserOtps
            .CountAsync(x => x.Destination == normalizedDestination && x.Purpose == purpose && x.CreatedAt >= since, cancellationToken);

        if (recentCount >= _options.MaxResendsPerHour)
        {
            throw new AppException("Too many OTP requests. Please try again later.", 429, "otp_rate_limited");
        }

        var activeOtps = await dbContext.UserOtps
            .Where(x => x.Destination == normalizedDestination && x.Purpose == purpose && x.ConsumedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var activeOtp in activeOtps)
        {
            activeOtp.ConsumedAt = clock.UtcNow;
        }

        var code = SecureTokenHasher.NewNumericCode(_options.Length);
        dbContext.UserOtps.Add(new UserOtp
        {
            UserId = userId,
            Destination = normalizedDestination,
            DestinationType = destinationType,
            Purpose = purpose,
            CodeHash = SecureTokenHasher.Hash(code),
            ExpiresAt = clock.UtcNow.AddMinutes(_options.ExpiryMinutes),
            MaxAttempts = _options.MaxAttempts,
            CreatedIp = ipAddress
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        return code;
    }

    public async Task VerifyOtpAsync(
        string destination,
        OtpPurpose purpose,
        string code,
        CancellationToken cancellationToken)
    {
        var normalizedDestination = NormalizeDestination(destination, OtpDestinationType.Email);
        var otp = await dbContext.UserOtps
            .Where(x => x.Destination == normalizedDestination && x.Purpose == purpose && x.ConsumedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new AppException("Invalid or expired OTP.", 400, "invalid_otp");

        if (!otp.IsUsable(clock.UtcNow))
        {
            otp.AttemptCount++;
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid or expired OTP.", 400, "invalid_otp");
        }

        var incomingHash = SecureTokenHasher.Hash(code);
        if (!string.Equals(incomingHash, otp.CodeHash, StringComparison.Ordinal))
        {
            otp.AttemptCount++;
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Invalid or expired OTP.", 400, "invalid_otp");
        }

        otp.ConsumedAt = clock.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeDestination(string destination, OtpDestinationType destinationType)
    {
        return destination.Trim().ToLowerInvariant();
    }
}
