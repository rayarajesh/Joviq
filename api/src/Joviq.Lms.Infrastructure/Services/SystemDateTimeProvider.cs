using Joviq.Lms.Application.Common.Interfaces;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
