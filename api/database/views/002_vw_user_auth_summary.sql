CREATE OR REPLACE VIEW vw_user_auth_summary AS
SELECT
    u."Id",
    u."FullName",
    u."Email",
    u."EmailConfirmed",
    u."PhoneNumber",
    u."PhoneNumberConfirmed",
    u."AccountStatus",
    u."OnboardingStatus",
    u."LastLoginAt",
    COUNT(s."Id") FILTER (
        WHERE s."RevokedAt" IS NULL AND s."ExpiresAt" > now()
    ) AS "ActiveSessionCount",
    MAX(a."CreatedAt") FILTER (
        WHERE a."EventType" = 'LoginSucceeded'
    ) AS "LastSuccessfulLoginAt",
    MAX(a."CreatedAt") FILTER (
        WHERE a."EventType" = 'LoginFailed'
    ) AS "LastFailedLoginAt"
FROM "AspNetUsers" u
LEFT JOIN user_sessions s ON s."UserId" = u."Id"
LEFT JOIN auth_audit_logs a ON a."UserId" = u."Id"
GROUP BY
    u."Id",
    u."FullName",
    u."Email",
    u."EmailConfirmed",
    u."PhoneNumber",
    u."PhoneNumberConfirmed",
    u."AccountStatus",
    u."OnboardingStatus",
    u."LastLoginAt";
