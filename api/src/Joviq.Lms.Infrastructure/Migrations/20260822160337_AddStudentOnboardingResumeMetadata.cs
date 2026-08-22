using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentOnboardingResumeMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResumeContentType",
                table: "student_profiles",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResumeFileName",
                table: "student_profiles",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ResumeSizeBytes",
                table: "student_profiles",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ResumeUploadedAt",
                table: "student_profiles",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResumeContentType",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "ResumeFileName",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "ResumeSizeBytes",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "ResumeUploadedAt",
                table: "student_profiles");
        }
    }
}
