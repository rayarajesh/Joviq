using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OnboardingReviewStatus",
                table: "student_profiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "OnboardingSubmittedAt",
                table: "student_profiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_OnboardingSubmittedAt",
                table: "student_profiles",
                column: "OnboardingSubmittedAt");

            // Earlier registration submissions already live in this table. Use the
            // last profile update as an approximate historical submission date.
            migrationBuilder.Sql("""
                UPDATE student_profiles
                SET "OnboardingSubmittedAt" = COALESCE("UpdatedAt", "CreatedAt"),
                    "OnboardingReviewStatus" = 'Submitted'
                WHERE NULLIF(TRIM("PreferredProgramSlug"), '') IS NOT NULL
                  AND "PreferredStartDate" IS NOT NULL
                  AND NULLIF(TRIM("CurrentYearOfStudy"), '') IS NOT NULL
                  AND NULLIF(TRIM("WhatsAppNumber"), '') IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_student_profiles_OnboardingSubmittedAt",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "OnboardingReviewStatus",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "OnboardingSubmittedAt",
                table: "student_profiles");
        }
    }
}
