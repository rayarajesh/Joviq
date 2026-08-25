using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueUserPhoneIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "AspNetUsers"
                SET "PhoneNumber" = NULL, "PhoneNumberConfirmed" = FALSE
                WHERE "PhoneNumber" = '';

                WITH ranked_phones AS (
                    SELECT
                        "Id",
                        ROW_NUMBER() OVER (
                            PARTITION BY "PhoneNumber"
                            ORDER BY "CreatedAt", "Id"
                        ) AS row_number
                    FROM "AspNetUsers"
                    WHERE "PhoneNumber" IS NOT NULL AND "PhoneNumber" <> ''
                )
                UPDATE "AspNetUsers" users
                SET "PhoneNumber" = NULL, "PhoneNumberConfirmed" = FALSE
                FROM ranked_phones
                WHERE users."Id" = ranked_phones."Id" AND ranked_phones.row_number > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PhoneNumber",
                table: "AspNetUsers",
                column: "PhoneNumber",
                unique: true,
                filter: "\"PhoneNumber\" IS NOT NULL AND \"PhoneNumber\" <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PhoneNumber",
                table: "AspNetUsers");
        }
    }
}
