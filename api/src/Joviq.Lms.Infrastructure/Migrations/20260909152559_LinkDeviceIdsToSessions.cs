using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LinkDeviceIdsToSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                WITH ranked_sessions AS (
                    SELECT "Id",
                           ROW_NUMBER() OVER (
                               PARTITION BY "UserId", "DeviceId"
                               ORDER BY COALESCE("LastSeenAt", "CreatedAt") DESC, "CreatedAt" DESC, "Id" DESC
                           ) AS row_number
                    FROM user_sessions
                    WHERE "DeviceId" IS NOT NULL AND "RevokedAt" IS NULL
                )
                UPDATE user_sessions AS session
                SET "RevokedAt" = CURRENT_TIMESTAMP,
                    "RevocationReason" = 'Duplicate device session cleaned during migration.'
                FROM ranked_sessions
                WHERE session."Id" = ranked_sessions."Id" AND ranked_sessions.row_number > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_user_sessions_UserId_DeviceId_Active",
                table: "user_sessions",
                columns: new[] { "UserId", "DeviceId" },
                unique: true,
                filter: "\"DeviceId\" IS NOT NULL AND \"RevokedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_user_sessions_UserId_DeviceId_Active",
                table: "user_sessions");
        }
    }
}
