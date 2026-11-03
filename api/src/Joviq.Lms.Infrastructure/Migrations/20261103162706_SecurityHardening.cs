using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SecurityHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The previous schema allowed concurrent requests to create multiple active/reserved
            // enrollments for the same student and program. Keep the most valuable row (paid first,
            // then active, then oldest), move dependent records to it, and remove only the duplicates
            // before adding the database-enforced uniqueness rule.
            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT "Id",
                           FIRST_VALUE("Id") OVER (
                               PARTITION BY "StudentId", "ProgramId"
                               ORDER BY ("PaidAmount" > 0) DESC,
                                        (CASE WHEN "Status" = 'Active' THEN 1 ELSE 0 END) DESC,
                                        "CreatedAt",
                                        "Id") AS "KeepId"
                    FROM "enrollments"
                    WHERE "Status" <> 'Cancelled'
                ), duplicates AS (
                    SELECT "Id", "KeepId"
                    FROM ranked
                    WHERE "Id" <> "KeepId"
                )
                UPDATE "payment_transactions" AS p
                SET "EnrollmentId" = d."KeepId"
                FROM duplicates AS d
                WHERE p."EnrollmentId" = d."Id";

                WITH ranked AS (
                    SELECT "Id",
                           FIRST_VALUE("Id") OVER (
                               PARTITION BY "StudentId", "ProgramId"
                               ORDER BY ("PaidAmount" > 0) DESC,
                                        (CASE WHEN "Status" = 'Active' THEN 1 ELSE 0 END) DESC,
                                        "CreatedAt",
                                        "Id") AS "KeepId"
                    FROM "enrollments"
                    WHERE "Status" <> 'Cancelled'
                ), duplicates AS (
                    SELECT "Id", "KeepId"
                    FROM ranked
                    WHERE "Id" <> "KeepId"
                )
                UPDATE "coupon_redemptions" AS r
                SET "EnrollmentId" = d."KeepId"
                FROM duplicates AS d
                WHERE r."EnrollmentId" = d."Id";

                WITH ranked AS (
                    SELECT "Id",
                           FIRST_VALUE("Id") OVER (
                               PARTITION BY "StudentId", "ProgramId"
                               ORDER BY ("PaidAmount" > 0) DESC,
                                        (CASE WHEN "Status" = 'Active' THEN 1 ELSE 0 END) DESC,
                                        "CreatedAt",
                                        "Id") AS "KeepId"
                    FROM "enrollments"
                    WHERE "Status" <> 'Cancelled'
                ), duplicates AS (
                    SELECT "Id", "KeepId"
                    FROM ranked
                    WHERE "Id" <> "KeepId"
                )
                UPDATE "project_assignments" AS a
                SET "EnrollmentId" = d."KeepId"
                FROM duplicates AS d
                WHERE a."EnrollmentId" = d."Id";

                WITH ranked AS (
                    SELECT "Id",
                           FIRST_VALUE("Id") OVER (
                               PARTITION BY "StudentId", "ProgramId"
                               ORDER BY ("PaidAmount" > 0) DESC,
                                        (CASE WHEN "Status" = 'Active' THEN 1 ELSE 0 END) DESC,
                                        "CreatedAt",
                                        "Id") AS "KeepId"
                    FROM "enrollments"
                    WHERE "Status" <> 'Cancelled'
                ), duplicates AS (
                    SELECT "Id", "KeepId"
                    FROM ranked
                    WHERE "Id" <> "KeepId"
                )
                UPDATE "project_submissions" AS s
                SET "EnrollmentId" = d."KeepId"
                FROM duplicates AS d
                WHERE s."EnrollmentId" = d."Id";

                WITH ranked AS (
                    SELECT "Id",
                           FIRST_VALUE("Id") OVER (
                               PARTITION BY "StudentId", "ProgramId"
                               ORDER BY ("PaidAmount" > 0) DESC,
                                        (CASE WHEN "Status" = 'Active' THEN 1 ELSE 0 END) DESC,
                                        "CreatedAt",
                                        "Id") AS "KeepId"
                    FROM "enrollments"
                    WHERE "Status" <> 'Cancelled'
                ), duplicates AS (
                    SELECT "Id", "KeepId"
                    FROM ranked
                    WHERE "Id" <> "KeepId"
                )
                UPDATE "certificates" AS c
                SET "EnrollmentId" = d."KeepId"
                FROM duplicates AS d
                WHERE c."EnrollmentId" = d."Id";

                WITH ranked AS (
                    SELECT "Id",
                           FIRST_VALUE("Id") OVER (
                               PARTITION BY "StudentId", "ProgramId"
                               ORDER BY ("PaidAmount" > 0) DESC,
                                        (CASE WHEN "Status" = 'Active' THEN 1 ELSE 0 END) DESC,
                                        "CreatedAt",
                                        "Id") AS "KeepId"
                    FROM "enrollments"
                    WHERE "Status" <> 'Cancelled'
                ), duplicates AS (
                    SELECT "Id", "KeepId"
                    FROM ranked
                    WHERE "Id" <> "KeepId"
                )
                DELETE FROM "enrollments" AS e
                USING duplicates AS d
                WHERE e."Id" = d."Id";
                """);

            migrationBuilder.DropIndex(
                name: "IX_enrollments_StudentId_ProgramId",
                table: "enrollments");

            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "payment_transactions",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_StudentId_IdempotencyKey",
                table: "payment_transactions",
                columns: new[] { "StudentId", "IdempotencyKey" },
                unique: true,
                filter: "\"IdempotencyKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_enrollments_StudentId_ProgramId",
                table: "enrollments",
                columns: new[] { "StudentId", "ProgramId" },
                unique: true,
                filter: "\"Status\" <> 'Cancelled'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payment_transactions_StudentId_IdempotencyKey",
                table: "payment_transactions");

            migrationBuilder.DropIndex(
                name: "IX_enrollments_StudentId_ProgramId",
                table: "enrollments");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "payment_transactions");

            migrationBuilder.CreateIndex(
                name: "IX_enrollments_StudentId_ProgramId",
                table: "enrollments",
                columns: new[] { "StudentId", "ProgramId" });
        }
    }
}
