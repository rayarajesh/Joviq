using Microsoft.EntityFrameworkCore.Migrations;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260909162000_BackfillEnrollmentAccessExpiry")]
public partial class BackfillEnrollmentAccessExpiry : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE enrollments
            SET "AccessExpiresAt" = "EnrolledAt" + INTERVAL '2 months'
            WHERE "AccessExpiresAt" IS NULL AND "PaidAmount" > 0;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Existing expiry dates may have been renewed after this migration, so they are intentionally preserved.
    }
}
