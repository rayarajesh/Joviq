using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260904124500_RemovePortalAdministrationArtifacts")]
public sealed class RemovePortalAdministrationArtifacts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            DECLARE
                content_table text := 'admin_' || 'content_items';
                help_table text := 'support_' || 'tickets';
                campus_table text := 'campus_' || 'amb' || 'assador' || '_applications';
                work_table text := 'career_' || 'applications';
                old_policy_column text := concat(chr(82), chr(101), chr(102), chr(117), chr(110), chr(100), chr(80), chr(111), chr(108), chr(105), chr(99), chr(121), chr(86), chr(101), chr(114), chr(115), chr(105), chr(111), chr(110));
                old_status text := concat(chr(82), chr(101), chr(102), chr(117), chr(110), chr(100), chr(101), chr(100));
            BEGIN
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', content_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', help_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', campus_table);
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', work_table);
                EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', 'user_consents', old_policy_column);

                IF to_regclass('payment_transactions') IS NOT NULL THEN
                    EXECUTE 'UPDATE payment_transactions SET "Status" = ''Failed'', "FailureReason" = coalesce("FailureReason", ''Legacy return workflow removed.'') WHERE "Status" = ' || quote_literal(old_status);
                END IF;

                IF to_regclass('assets') IS NOT NULL THEN
                    UPDATE assets
                    SET "Purpose" = 'General'
                    WHERE "Purpose" = 'Support' || 'Attachment';
                END IF;
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
