using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPostPaymentRegistrationDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentYearOfStudy",
                table: "student_profiles",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredCategoryName",
                table: "student_profiles",
                type: "character varying(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredProgramSlug",
                table: "student_profiles",
                type: "character varying(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredProgramTitle",
                table: "student_profiles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PreferredStartDate",
                table: "student_profiles",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WhatsAppNumber",
                table: "student_profiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentYearOfStudy",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "PreferredCategoryName",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "PreferredProgramSlug",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "PreferredProgramTitle",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "PreferredStartDate",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "WhatsAppNumber",
                table: "student_profiles");
        }
    }
}
