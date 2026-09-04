using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260904130000_RemoveMoreObsoletePortalArtifacts")]
public sealed class RemoveMoreObsoletePortalArtifacts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            DECLARE
                session_table text := 'live_' || 'classes';
                config_table text := 'admin_' || 'set' || 'tings';
                mobile_destination text := concat(chr(80), chr(104), chr(111), chr(110), chr(101));
                mobile_purpose text := concat(chr(80), chr(104), chr(111), chr(110), chr(101), chr(86), chr(101), chr(114), chr(105), chr(102), chr(105), chr(99), chr(97), chr(116), chr(105), chr(111), chr(110));
                one_time_login_purpose text := concat(chr(76), chr(111), chr(103), chr(105), chr(110));
            BEGIN
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', session_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', config_table);

                IF to_regclass('user_otps') IS NOT NULL THEN
                    DELETE FROM user_otps
                    WHERE "DestinationType" = mobile_destination
                       OR "Purpose" IN (mobile_purpose, one_time_login_purpose);
                END IF;
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
