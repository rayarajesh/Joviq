using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Joviq.Lms.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261001084500_RepairCertificateFields")]
public sealed class RepairCertificateFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // The existing snapshot already contains these fields, but no prior migration creates them.
        migrationBuilder.AddColumn<string>(name: "StudentName", table: "certificates",
            type: "character varying(180)", maxLength: 180, nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<DateOnly>(name: "FromDate", table: "certificates", type: "date", nullable: true);
        migrationBuilder.AddColumn<DateOnly>(name: "ToDate", table: "certificates", type: "date", nullable: true);
        migrationBuilder.AddColumn<string>(name: "SignatureText", table: "certificates",
            type: "character varying(180)", maxLength: 180, nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "StudentName", table: "certificates");
        migrationBuilder.DropColumn(name: "FromDate", table: "certificates");
        migrationBuilder.DropColumn(name: "ToDate", table: "certificates");
        migrationBuilder.DropColumn(name: "SignatureText", table: "certificates");
    }
}
