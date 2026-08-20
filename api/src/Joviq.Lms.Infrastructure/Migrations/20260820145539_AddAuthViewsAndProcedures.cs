using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthViewsAndProcedures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE EXTENSION IF NOT EXISTS pgcrypto;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE PROCEDURE auth_create_audit_log(
                    p_user_id uuid,
                    p_event_type text,
                    p_email text,
                    p_phone text,
                    p_ip_address text,
                    p_user_agent text,
                    p_metadata jsonb
                )
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    INSERT INTO auth_audit_logs (
                        "Id",
                        "UserId",
                        "EventType",
                        "Email",
                        "Phone",
                        "IpAddress",
                        "UserAgent",
                        "MetadataJson",
                        "CreatedAt"
                    )
                    VALUES (
                        gen_random_uuid(),
                        p_user_id,
                        p_event_type,
                        p_email,
                        p_phone,
                        p_ip_address,
                        p_user_agent,
                        p_metadata,
                        now()
                    );
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE PROCEDURE auth_revoke_user_sessions(
                    p_user_id uuid,
                    p_except_session_id uuid,
                    p_revoked_by_ip text,
                    p_reason text
                )
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    UPDATE user_sessions
                    SET
                        "RevokedAt" = now(),
                        "RevokedByIp" = p_revoked_by_ip,
                        "RevocationReason" = p_reason,
                        "UpdatedAt" = now()
                    WHERE "UserId" = p_user_id
                      AND "RevokedAt" IS NULL
                      AND (p_except_session_id IS NULL OR "Id" <> p_except_session_id);
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE PROCEDURE auth_cleanup_expired_otps()
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    UPDATE user_otps
                    SET
                        "ConsumedAt" = now(),
                        "UpdatedAt" = now()
                    WHERE "ConsumedAt" IS NULL
                      AND "ExpiresAt" < now();
                END;
                $$;
                """);

            migrationBuilder.Sql("""
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
                """);

            migrationBuilder.Sql("""
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
                """);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP VIEW IF EXISTS vw_user_auth_summary;""");
            migrationBuilder.Sql("""DROP VIEW IF EXISTS vw_active_user_sessions;""");
            migrationBuilder.Sql("""DROP PROCEDURE IF EXISTS auth_cleanup_expired_otps();""");
            migrationBuilder.Sql("""DROP PROCEDURE IF EXISTS auth_revoke_user_sessions(uuid, uuid, text, text);""");
            migrationBuilder.Sql("""DROP PROCEDURE IF EXISTS auth_create_audit_log(uuid, text, text, text, text, text, jsonb);""");

        }
    }
}
