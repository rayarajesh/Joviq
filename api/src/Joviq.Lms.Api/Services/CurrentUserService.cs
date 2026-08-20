using System.Security.Claims;
using Joviq.Lms.Application.Common.Interfaces;

namespace Joviq.Lms.Api.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue("sub");
            return Guid.TryParse(value, out var userId) ? userId : null;
        }
    }

    public Guid? SessionId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue("sid");
            return Guid.TryParse(value, out var sessionId) ? sessionId : null;
        }
    }

    public IReadOnlyList<string> Roles =>
        httpContextAccessor.HttpContext?.User.FindAll("role").Select(x => x.Value).ToList() ?? [];
}
