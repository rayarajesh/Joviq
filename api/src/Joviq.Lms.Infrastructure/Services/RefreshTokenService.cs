using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UAParser;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class RefreshTokenService(
    ApplicationDbContext dbContext,
    IDateTimeProvider clock,
    IOptions<RefreshTokenOptions> options) : IRefreshTokenService
{
    private readonly RefreshTokenOptions _options = options.Value;
    private static readonly Parser UserAgentParser = Parser.GetDefault();

    public async Task<(UserSession Session, string RawRefreshToken)> CreateSessionAsync(
        Guid userId,
        string jwtId,
        bool rememberMe,
        RequestMetadata metadata,
        CancellationToken cancellationToken)
    {
        var rawRefreshToken = SecureTokenHasher.NewUrlSafeToken();
        var session = BuildSession(userId, jwtId, rawRefreshToken, rememberMe, metadata, Guid.NewGuid());

        dbContext.UserSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (session, rawRefreshToken);
    }

    public async Task<(UserSession Session, string RawRefreshToken)> RotateAsync(
        string rawRefreshToken,
        string jwtId,
        RequestMetadata metadata,
        CancellationToken cancellationToken)
    {
        var tokenHash = SecureTokenHasher.Hash(rawRefreshToken);
        var session = await dbContext.UserSessions
            .FirstOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (session is null)
        {
            throw new AppException("Invalid refresh token.", 401, "invalid_refresh_token");
        }

        if (session.RevokedAt is not null)
        {
            await RevokeTokenFamilyAsync(session.RefreshTokenFamilyId, metadata.IpAddress, "Refresh token reuse detected.", cancellationToken);
            throw new AppException("Refresh token reuse detected. Please login again.", 401, "refresh_token_reuse");
        }

        if (session.ExpiresAt <= clock.UtcNow)
        {
            session.RevokedAt = clock.UtcNow;
            session.RevokedByIp = metadata.IpAddress;
            session.RevocationReason = "Expired refresh token.";
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("Refresh token expired. Please login again.", 401, "refresh_token_expired");
        }

        var newRawRefreshToken = SecureTokenHasher.NewUrlSafeToken();
        var replacement = BuildSession(
            session.UserId,
            jwtId,
            newRawRefreshToken,
            session.IsPersistent,
            metadata,
            session.RefreshTokenFamilyId);

        session.RevokedAt = clock.UtcNow;
        session.RevokedByIp = metadata.IpAddress;
        session.RevocationReason = "Rotated refresh token.";
        session.ReplacedBySessionId = replacement.Id;
        session.LastSeenAt = clock.UtcNow;

        dbContext.UserSessions.Add(replacement);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (replacement, newRawRefreshToken);
    }

    public async Task RevokeSessionAsync(Guid userId, Guid sessionId, string? ipAddress, string reason, CancellationToken cancellationToken)
    {
        var session = await dbContext.UserSessions
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == sessionId, cancellationToken);

        if (session is null)
        {
            return;
        }

        session.RevokedAt ??= clock.UtcNow;
        session.RevokedByIp = ipAddress;
        session.RevocationReason = reason;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllAsync(Guid userId, string? ipAddress, string reason, CancellationToken cancellationToken)
    {
        var sessions = await dbContext.UserSessions
            .Where(x => x.UserId == userId && x.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = clock.UtcNow;
            session.RevokedByIp = ipAddress;
            session.RevocationReason = reason;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllExceptAsync(Guid userId, Guid? currentSessionId, string? ipAddress, string reason, CancellationToken cancellationToken)
    {
        var sessions = await dbContext.UserSessions
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.Id != currentSessionId)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = clock.UtcNow;
            session.RevokedByIp = ipAddress;
            session.RevocationReason = reason;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task RevokeTokenFamilyAsync(Guid familyId, string? ipAddress, string reason, CancellationToken cancellationToken)
    {
        var sessions = await dbContext.UserSessions
            .Where(x => x.RefreshTokenFamilyId == familyId && x.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = clock.UtcNow;
            session.RevokedByIp = ipAddress;
            session.RevocationReason = reason;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private UserSession BuildSession(
        Guid userId,
        string jwtId,
        string rawRefreshToken,
        bool rememberMe,
        RequestMetadata metadata,
        Guid familyId)
    {
        var clientInfo = string.IsNullOrWhiteSpace(metadata.UserAgent)
            ? null
            : UserAgentParser.Parse(metadata.UserAgent);

        return new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RefreshTokenHash = SecureTokenHasher.Hash(rawRefreshToken),
            RefreshTokenFamilyId = familyId,
            JwtId = jwtId,
            DeviceId = metadata.DeviceId,
            DeviceName = metadata.DeviceName,
            Browser = clientInfo?.UA.Family,
            OperatingSystem = clientInfo?.OS.Family,
            IpAddress = metadata.IpAddress,
            UserAgent = metadata.UserAgent,
            LastSeenAt = clock.UtcNow,
            ExpiresAt = clock.UtcNow.AddDays(rememberMe ? _options.RememberMeDays : _options.DefaultDays),
            IsPersistent = rememberMe
        };
    }
}
