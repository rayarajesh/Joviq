using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260909050000_AddCurriculumModuleLessonManagement")]
public sealed class AddCurriculumModuleLessonManagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsActive",
            table: "curriculum_modules",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "IsActive",
            table: "lessons",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.DropIndex(
            name: "IX_curriculum_modules_ProgramId_SortOrder",
            table: "curriculum_modules");

        migrationBuilder.DropIndex(
            name: "IX_lessons_ModuleId_SortOrder",
            table: "lessons");

        migrationBuilder.CreateIndex(
            name: "IX_curriculum_modules_ProgramId_IsActive_SortOrder",
            table: "curriculum_modules",
            columns: new[] { "ProgramId", "IsActive", "SortOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_lessons_ModuleId_IsActive_SortOrder",
            table: "lessons",
            columns: new[] { "ModuleId", "IsActive", "SortOrder" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex("IX_curriculum_modules_ProgramId_IsActive_SortOrder", "curriculum_modules");
        migrationBuilder.DropIndex("IX_lessons_ModuleId_IsActive_SortOrder", "lessons");
        migrationBuilder.DropColumn("IsActive", "curriculum_modules");
        migrationBuilder.DropColumn("IsActive", "lessons");
        migrationBuilder.CreateIndex("IX_curriculum_modules_ProgramId_SortOrder", "curriculum_modules", "ProgramId", "SortOrder");
        migrationBuilder.CreateIndex("IX_lessons_ModuleId_SortOrder", "lessons", "ModuleId", "SortOrder");
    }
}
