namespace Joviq.Lms.Application.Auth;

public interface IJwtTokenService
{
    Task<(string AccessToken, int ExpiresIn)> CreateAccessTokenAsync(Guid userId, Guid sessionId, string jwtId, CancellationToken cancellationToken);
}
