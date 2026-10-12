using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdminPaymentMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "GatewayOrderId",
                table: "payment_transactions",
                type: "character varying(160)",
                maxLength: 160,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(160)",
                oldMaxLength: 160);

            migrationBuilder.AddColumn<string>(
                name: "GatewayLinkId",
                table: "payment_transactions",
                type: "character varying(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "payment_transactions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GatewayLinkId",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "payment_transactions");

            migrationBuilder.AlterColumn<string>(
                name: "GatewayOrderId",
                table: "payment_transactions",
                type: "character varying(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(160)",
                oldMaxLength: 160,
                oldNullable: true);
        }
    }
}
