using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePlanPricing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE program_plans
                SET "ActualPrice" = 8000, "OfferPrice" = 8000, "ReserveAmount" = 1500
                WHERE "Code" = 'SELF';
                UPDATE program_plans
                SET "ActualPrice" = 10000, "OfferPrice" = 10000, "ReserveAmount" = 1500
                WHERE "Code" = 'INTERMEDIATE';
                UPDATE program_plans
                SET "ActualPrice" = 15000, "OfferPrice" = 15000, "ReserveAmount" = 3000
                WHERE "Code" = 'MASTER';
                """);
        }
    }
}
