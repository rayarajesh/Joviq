using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class JwtTokenService(
    UserManager<ApplicationUser> userManager,
    IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    public async Task<(string AccessToken, int ExpiresIn)> CreateAccessTokenAsync(
        Guid userId,
        Guid sessionId,
        string jwtId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var roles = await userManager.GetRolesAsync(user);
        var now = DateTimeOffset.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, jwtId),
            new("sid", sessionId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("email_verified", user.EmailConfirmed.ToString().ToLowerInvariant()),
            new("phone_number", user.PhoneNumber ?? string.Empty),
            new("phone_number_verified", user.PhoneNumberConfirmed.ToString().ToLowerInvariant()),
            new("account_status", user.AccountStatus.ToString()),
            new("onboarding_status", user.OnboardingStatus.ToString())
        };

        claims.AddRange(roles.Select(role => new Claim("role", role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        return (accessToken, (int)TimeSpan.FromMinutes(_options.AccessTokenMinutes).TotalSeconds);
    }
}
