using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Deadline",
                table: "projects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceMediaUrl",
                table: "projects",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsefulLinksJson",
                table: "projects",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.CreateTable(
                name: "project_assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EnrollmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_project_assignments_enrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalTable: "enrollments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_project_assignments_projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_project_assignments_EnrollmentId",
                table: "project_assignments",
                column: "EnrollmentId");

            migrationBuilder.CreateIndex(
                name: "IX_project_assignments_ProjectId_StudentId",
                table: "project_assignments",
                columns: new[] { "ProjectId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_assignments_StudentId_ProjectId",
                table: "project_assignments",
                columns: new[] { "StudentId", "ProjectId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "project_assignments");

            migrationBuilder.DropColumn(
                name: "Deadline",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "ReferenceMediaUrl",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "UsefulLinksJson",
                table: "projects");
        }
    }
}
