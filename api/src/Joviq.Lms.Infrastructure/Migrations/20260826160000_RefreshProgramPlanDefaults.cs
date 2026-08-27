using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260826160000_RefreshProgramPlanDefaults")]
public sealed class RefreshProgramPlanDefaults : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE "program_plans"
            SET
                "Name" = 'Self-Paced',
                "ActualPrice" = 7999,
                "OfferPrice" = 3999,
                "FeaturesJson" = '["Recorded Classes","Complete Curriculum","Assignments","Projects","Assessments","LMS Access","Certificate","Basic Support"]'::jsonb
            WHERE "Code" = 'SELF';

            UPDATE "program_plans"
            SET
                "Name" = 'Intermediate',
                "ActualPrice" = 9999,
                "OfferPrice" = 4999,
                "FeaturesJson" = '["Live Sessions","Mentor Support","Project Reviews","AI Assessment","AI Interview","Resume Review","Interview Preparation","Priority Support"]'::jsonb
            WHERE "Code" = 'INTERMEDIATE';

            UPDATE "program_plans"
            SET
                "Name" = 'Master',
                "ActualPrice" = 14999,
                "OfferPrice" = 9999,
                "FeaturesJson" = '["Personal Mentor","Additional Live Sessions","Advanced Project Reviews","Portfolio Development","Resume Optimization","Mock Interviews","Technical Interview Preparation","HR Interview Preparation","Career / Placement Assistance","Priority Support"]'::jsonb
            WHERE "Code" = 'MASTER';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE "program_plans"
            SET "FeaturesJson" = '["Recorded lessons","Assignments","Certificate","Community access"]'::jsonb
            WHERE "Code" = 'SELF';

            UPDATE "program_plans"
            SET "FeaturesJson" = '["Live sessions","Mentor support","Project reviews","AI assessment","AI interview","Resume review","Interview preparation"]'::jsonb
            WHERE "Code" = 'INTERMEDIATE';

            UPDATE "program_plans"
            SET "FeaturesJson" = '["Personal mentor","Additional live sessions","Advanced project reviews","Portfolio development","Resume optimization","Mock interviews","Placement assistance"]'::jsonb
            WHERE "Code" = 'MASTER';
            """);
    }
}
