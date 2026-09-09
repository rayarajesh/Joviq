using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentAccessControls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CheckoutExpiresAt",
                table: "payment_transactions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceNumber",
                table: "payment_transactions",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccessCycle",
                table: "enrollments",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AccessExpiresAt",
                table: "enrollments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_GatewayPaymentId",
                table: "payment_transactions",
                column: "GatewayPaymentId",
                unique: true,
                filter: "\"GatewayPaymentId\" IS NOT NULL");

            migrationBuilder.Sql("""
                UPDATE program_plans
                SET "Name" = 'Launch', "ActualPrice" = 8000, "OfferPrice" = 8000, "ReserveAmount" = 1500
                WHERE "Code" = 'SELF';
                UPDATE program_plans
                SET "Name" = 'Elevate', "ActualPrice" = 10000, "OfferPrice" = 10000, "ReserveAmount" = 1500
                WHERE "Code" = 'INTERMEDIATE';
                UPDATE program_plans
                SET "Name" = 'Mastery', "ActualPrice" = 15000, "OfferPrice" = 15000, "ReserveAmount" = 3000
                WHERE "Code" = 'MASTER';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payment_transactions_GatewayPaymentId",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "CheckoutExpiresAt",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "AccessCycle",
                table: "enrollments");

            migrationBuilder.DropColumn(
                name: "AccessExpiresAt",
                table: "enrollments");
        }
    }
}
