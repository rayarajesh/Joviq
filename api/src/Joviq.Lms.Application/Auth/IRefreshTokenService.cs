using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Domain.Entities;

namespace Joviq.Lms.Application.Auth;

public interface IRefreshTokenService
{
    Task<(UserSession Session, string RawRefreshToken)> CreateSessionAsync(
        Guid userId,
        string jwtId,
        bool rememberMe,
        RequestMetadata metadata,
        CancellationToken cancellationToken);

    Task<(UserSession Session, string RawRefreshToken)> RotateAsync(
        string rawRefreshToken,
        string jwtId,
        RequestMetadata metadata,
        CancellationToken cancellationToken);

    Task RevokeSessionAsync(Guid userId, Guid sessionId, string? ipAddress, string reason, CancellationToken cancellationToken);

    Task RevokeAllAsync(Guid userId, string? ipAddress, string reason, CancellationToken cancellationToken);

    Task RevokeAllExceptAsync(Guid userId, Guid? currentSessionId, string? ipAddress, string reason, CancellationToken cancellationToken);
}
