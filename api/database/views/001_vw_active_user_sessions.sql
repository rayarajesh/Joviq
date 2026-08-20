CREATE OR REPLACE VIEW vw_active_user_sessions AS
SELECT
    s."Id",
    s."UserId",
    u."FullName",
    u."Email",
    s."DeviceName",
    s."Browser",
    s."OperatingSystem",
    s."IpAddress",
    s."CreatedAt",
    s."LastSeenAt",
    s."ExpiresAt",
    s."IsPersistent"
FROM user_sessions s
JOIN "AspNetUsers" u ON u."Id" = s."UserId"
WHERE s."RevokedAt" IS NULL
  AND s."ExpiresAt" > now();
