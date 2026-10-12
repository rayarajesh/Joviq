using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations;

[Migration("20261013120000_UpdateFixedPlanPricing")]
[DbContext(typeof(ApplicationDbContext))]
public partial class UpdateFixedPlanPricing : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE program_plans
            SET "ActualPrice" = 4000, "OfferPrice" = 4000, "ReserveAmount" = 1500
            WHERE "Code" = 'SELF';
            UPDATE program_plans
            SET "ActualPrice" = 5000, "OfferPrice" = 5000, "ReserveAmount" = 1500
            WHERE "Code" = 'INTERMEDIATE';
            UPDATE program_plans
            SET "ActualPrice" = 7000, "OfferPrice" = 7000, "ReserveAmount" = 1500
            WHERE "Code" = 'MASTER';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE program_plans
            SET "ActualPrice" = 7999, "OfferPrice" = 7999, "ReserveAmount" = 1500
            WHERE "Code" = 'SELF';
            UPDATE program_plans
            SET "ActualPrice" = 9999, "OfferPrice" = 9999, "ReserveAmount" = 1500
            WHERE "Code" = 'INTERMEDIATE';
            UPDATE program_plans
            SET "ActualPrice" = 14999, "OfferPrice" = 14999, "ReserveAmount" = 1500
            WHERE "Code" = 'MASTER';
            """);
    }
}
