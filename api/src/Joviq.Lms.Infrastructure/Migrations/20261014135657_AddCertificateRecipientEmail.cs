using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificateRecipientEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StudentEmail",
                table: "certificates",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StudentEmail",
                table: "certificates");
        }
    }
}
