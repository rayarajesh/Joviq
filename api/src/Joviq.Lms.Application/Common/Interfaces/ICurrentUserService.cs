namespace Joviq.Lms.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }

    Guid? SessionId { get; }

    IReadOnlyList<string> Roles { get; }
}
