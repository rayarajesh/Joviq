using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Joviq.Lms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponTargetingAndRedemptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CouponCode",
                table: "payment_transactions",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CouponId",
                table: "payment_transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "payment_transactions",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalAmount",
                table: "payment_transactions",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "enrollments",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "AudienceType",
                table: "coupons",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "Everyone");

            migrationBuilder.AddColumn<int>(
                name: "MaxRedemptions",
                table: "coupons",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxRedemptionsPerStudent",
                table: "coupons",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "MaximumDiscountAmount",
                table: "coupons",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinimumOrderAmount",
                table: "coupons",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetCategoryIdsJson",
                table: "coupons",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "TargetProgramIdsJson",
                table: "coupons",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "TargetStudentEmailsJson",
                table: "coupons",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "TargetStudentIdsJson",
                table: "coupons",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.CreateTable(
                name: "coupon_redemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EnrollmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OriginalAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    FinalAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coupon_redemptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_coupon_redemptions_coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_CouponId",
                table: "payment_transactions",
                column: "CouponId");

            migrationBuilder.CreateIndex(
                name: "IX_coupon_redemptions_CouponId_Status",
                table: "coupon_redemptions",
                columns: new[] { "CouponId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_coupon_redemptions_CouponId_StudentId_Status",
                table: "coupon_redemptions",
                columns: new[] { "CouponId", "StudentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_coupon_redemptions_PaymentTransactionId",
                table: "coupon_redemptions",
                column: "PaymentTransactionId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_payment_transactions_coupons_CouponId",
                table: "payment_transactions",
                column: "CouponId",
                principalTable: "coupons",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_payment_transactions_coupons_CouponId",
                table: "payment_transactions");

            migrationBuilder.DropTable(
                name: "coupon_redemptions");

            migrationBuilder.DropIndex(
                name: "IX_payment_transactions_CouponId",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "CouponCode",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "CouponId",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "OriginalAmount",
                table: "payment_transactions");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "enrollments");

            migrationBuilder.DropColumn(
                name: "AudienceType",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "MaxRedemptions",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "MaxRedemptionsPerStudent",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "MaximumDiscountAmount",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "MinimumOrderAmount",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "TargetCategoryIdsJson",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "TargetProgramIdsJson",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "TargetStudentEmailsJson",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "TargetStudentIdsJson",
                table: "coupons");
        }
    }
}
