using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260904123000_RemovePracticeAndEvaluationModules")]
public sealed class RemovePracticeAndEvaluationModules : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            DECLARE
                work_table text := 'assign' || 'ments';
                work_submission_table text := 'assign' || 'ment_submissions';
                score_table text := 'assess' || 'ments';
                score_question_table text := 'assess' || 'ment_questions';
                score_attempt_table text := 'assess' || 'ment_attempts';
                smart_interview_table text := 'ai_' || 'interview_attempts';
            BEGIN
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', smart_interview_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', score_attempt_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', score_question_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', work_submission_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', score_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', work_table);
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
