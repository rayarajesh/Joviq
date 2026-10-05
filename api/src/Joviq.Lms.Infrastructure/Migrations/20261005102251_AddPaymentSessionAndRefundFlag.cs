using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentSessionAndRefundFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payment_transactions_EnrollmentId",
                table: "payment_transactions");

            migrationBuilder.AddColumn<string>(
                name: "GatewaySessionId",
                table: "payment_transactions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RefundRequired",
                table: "payment_transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_EnrollmentId_Status",
                table: "payment_transactions",
                columns: new[] { "EnrollmentId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payment_transactions_EnrollmentId_Status",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "GatewaySessionId",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "RefundRequired",
                table: "payment_transactions");

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_EnrollmentId",
                table: "payment_transactions",
                column: "EnrollmentId");
        }
    }
}
