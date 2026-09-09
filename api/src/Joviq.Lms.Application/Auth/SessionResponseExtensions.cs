namespace Joviq.Lms.Application.Auth;

public static class SessionResponseExtensions
{
    public static IReadOnlyList<SessionResponse> CollapseDuplicateDevices(this IEnumerable<SessionResponse> sessions)
    {
        return sessions
            .GroupBy(BuildDeviceKey)
            .Select(group => group
                .OrderByDescending(session => session.IsCurrent)
                .ThenByDescending(session => session.LastSeenAt ?? session.CreatedAt)
                .First())
            .OrderByDescending(session => session.IsCurrent)
            .ThenByDescending(session => session.LastSeenAt ?? session.CreatedAt)
            .ToList();
    }

    private static string BuildDeviceKey(SessionResponse session)
    {
        if (!string.IsNullOrWhiteSpace(session.DeviceId))
        {
            return $"device:{session.DeviceId}";
        }

        return $"legacy:{session.DeviceName}|{session.Browser}|{session.OperatingSystem}|{session.IpAddress}";
    }
}
