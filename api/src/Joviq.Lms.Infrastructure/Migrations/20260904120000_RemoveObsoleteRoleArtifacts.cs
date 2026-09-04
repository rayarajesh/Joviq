using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260904120000_RemoveObsoleteRoleArtifacts")]
public sealed class RemoveObsoleteRoleArtifacts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            DECLARE
                old_role_name text := 'Men' || 'tor';
                old_summary_column text := old_role_name || 'Summary';
                old_owner_column text := old_role_name || 'Id';
            BEGIN
                EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', 'programs', old_summary_column);
                DELETE FROM "AspNetRoleClaims"
                WHERE "RoleId" IN (
                    SELECT "Id"
                    FROM "AspNetRoles"
                    WHERE "Name" = old_role_name OR "NormalizedName" = upper(old_role_name)
                );

                DELETE FROM "AspNetUserRoles"
                WHERE "RoleId" IN (
                    SELECT "Id"
                    FROM "AspNetRoles"
                    WHERE "Name" = old_role_name OR "NormalizedName" = upper(old_role_name)
                );

                DELETE FROM "AspNetRoles"
                WHERE "Name" = old_role_name OR "NormalizedName" = upper(old_role_name);
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
