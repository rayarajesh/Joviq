using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Lms;
using Joviq.Lms.Application.Users;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Moq;

namespace Joviq.Lms.Tests;

/// <summary>End-to-end checkout → gateway → verify/webhook scenarios against the real LMS service.</summary>
public sealed class PaymentFlowTests
{
    [Fact]
    public async Task PaymentCapturedInTimeIsCreditedEvenWhenConfirmedAfterCheckoutExpiry()
    {
        using var f = new Fixture();
        var checkout = await f.Checkout(PaymentMode.ReserveSeat);
        f.Pay(checkout.GatewayOrderId);
        f.Now = f.Now.AddMinutes(45);

        var payment = await f.Verify(checkout);

        Assert.Equal("Verified", payment.Status);
        Assert.Equal(1500, f.Enrollment().PaidAmount);
    }

    [Fact]
    public async Task UnpaidCheckoutReportsPendingWithoutFailingIt()
    {
        using var f = new Fixture();
        var checkout = await f.Checkout(PaymentMode.ReserveSeat);

        var error = await Assert.ThrowsAsync<AppException>(() => f.Verify(checkout));

        Assert.Equal("payment_pending", error.ErrorCode);
        Assert.Equal(PaymentStatus.Pending, f.Transaction(checkout).Status);
    }

    [Fact]
    public async Task UnpaidCheckoutPastExpiryIsFailed()
    {
        using var f = new Fixture();
        var checkout = await f.Checkout(PaymentMode.ReserveSeat);
        f.Now = f.Now.AddMinutes(45);

        var error = await Assert.ThrowsAsync<AppException>(() => f.Verify(checkout));

        Assert.Equal("payment_expired", error.ErrorCode);
        Assert.Equal(PaymentStatus.Failed, f.Transaction(checkout).Status);
    }

    [Fact]
    public async Task RetryingReopensTheSameGatewayOrder()
    {
        using var f = new Fixture();
        var first = await f.Checkout(PaymentMode.PayInFull);
        var second = await f.Checkout(PaymentMode.PayInFull);

        Assert.Equal(first.GatewayOrderId, second.GatewayOrderId);
        Assert.Equal(first.PaymentSessionId, second.PaymentSessionId);
        Assert.Single(f.Db.PaymentTransactions);
        Assert.Equal(1, f.OrdersCreated);
    }

    [Fact]
    public async Task EarlierAttemptPaidAfterThePopupClosedIsCreditedInsteadOfChargingAgain()
    {
        using var f = new Fixture();
        var first = await f.Checkout(PaymentMode.ReserveSeat);
        await f.Service.MarkPaymentFailedAsync(f.StudentId, first.Transaction.Id, "closed", default);
        f.Pay(first.GatewayOrderId); // the UPI payment completed after the pop-up was closed

        var error = await Assert.ThrowsAsync<AppException>(() => f.Checkout(PaymentMode.ReserveSeat));

        Assert.Equal("payment_already_received", error.ErrorCode);
        Assert.Equal(PaymentStatus.Verified, f.Transaction(first).Status);
        Assert.Equal(1500, f.Enrollment().PaidAmount);
        Assert.Equal(1, f.OrdersCreated);
    }

    [Fact]
    public async Task MoneyBeyondTheBalanceIsFlaggedForRefundAndAdminsAreNotified()
    {
        using var f = new Fixture();
        var first = await f.Checkout(PaymentMode.PayInFull);
        await f.Service.MarkPaymentFailedAsync(f.StudentId, first.Transaction.Id, "closed", default);
        var second = await f.Checkout(PaymentMode.PayInFull);
        f.Pay(first.GatewayOrderId);
        f.Pay(second.GatewayOrderId);

        await f.Verify(second);
        await f.Webhook(first.GatewayOrderId);

        Assert.False(f.Transaction(second).RefundRequired);
        Assert.True(f.Transaction(first).RefundRequired);
        Assert.Equal(7999, f.Enrollment().PaidAmount);
        Assert.Single(f.Db.Notifications.Where(x => x.UserId == f.AdminId && x.Title == "Refund needed"));
        Assert.Single(f.Db.Notifications.Where(x => x.UserId == f.StudentId && x.Title == "Extra payment received"));
    }

    [Fact]
    public async Task ChoosingAnotherPlanBeforePayingChargesTheNewPlan()
    {
        using var f = new Fixture();
        await f.Checkout(PaymentMode.ReserveSeat);

        var checkout = await f.Checkout(PaymentMode.PayInFull, f.MasteryPlanId);

        Assert.Equal(14999, checkout.Transaction.Amount);
        Assert.Equal(f.MasteryPlanId, f.Enrollment().ProgramPlanId);
    }

    [Fact]
    public async Task PlanCannotChangeAfterAPayment()
    {
        using var f = new Fixture();
        var reserve = await f.Checkout(PaymentMode.ReserveSeat);
        f.Pay(reserve.GatewayOrderId);
        await f.Verify(reserve);

        var balance = await f.Checkout(PaymentMode.RemainingBalance, f.MasteryPlanId);

        Assert.Equal(6499, balance.Transaction.Amount);
        Assert.Equal(f.LaunchPlanId, f.Enrollment().ProgramPlanId);
    }

    [Fact]
    public async Task WebhookAndVerifyCreditThePaymentOnce()
    {
        using var f = new Fixture();
        var checkout = await f.Checkout(PaymentMode.ReserveSeat);
        f.Pay(checkout.GatewayOrderId);

        await f.Webhook(checkout.GatewayOrderId);
        await f.Verify(checkout);
        await f.Webhook(checkout.GatewayOrderId);

        Assert.Equal(1500, f.Enrollment().PaidAmount);
        Assert.Single(f.Db.Notifications.Where(x => x.Title == "Payment verified"));
    }

    [Fact]
    public async Task ReserveThenBalanceUnlocksFullAccess()
    {
        using var f = new Fixture();
        var reserve = await f.Checkout(PaymentMode.ReserveSeat);
        f.Pay(reserve.GatewayOrderId);
        await f.Verify(reserve);
        var balance = await f.Checkout(PaymentMode.RemainingBalance);
        f.Pay(balance.GatewayOrderId);
        await f.Verify(balance);

        var enrollment = f.Enrollment();
        Assert.Equal(7999, enrollment.PaidAmount);
        Assert.Equal(EnrollmentStatus.Active, enrollment.Status);
        Assert.DoesNotContain(f.Db.PaymentTransactions, x => x.RefundRequired);
    }

    private sealed class Fixture : IDisposable
    {
        public ApplicationDbContext Db { get; }
        public LmsPortalService Service { get; }
        public Guid StudentId { get; } = Guid.NewGuid();
        public Guid AdminId { get; } = Guid.NewGuid();
        public Guid ProgramId { get; } = Guid.NewGuid();
        public Guid LaunchPlanId { get; } = Guid.NewGuid();
        public Guid MasteryPlanId { get; } = Guid.NewGuid();
        public DateTimeOffset Now { get; set; } = DateTimeOffset.UtcNow;
        public int OrdersCreated { get; private set; }
        private readonly Dictionary<string, string> _paidOrders = [];

        public Fixture()
        {
            Db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options);
            var studentRole = Guid.NewGuid();
            var adminRole = Guid.NewGuid();
            var categoryId = Guid.NewGuid();
            Db.Users.Add(new ApplicationUser { Id = StudentId, FullName = "Student", Email = "student@example.test", PhoneNumber = "9876543210", AccountStatus = AccountStatus.Active, EmailConfirmed = true });
            Db.Users.Add(new ApplicationUser { Id = AdminId, FullName = "Admin", Email = "admin@example.test", AccountStatus = AccountStatus.Active, EmailConfirmed = true });
            Db.Roles.Add(new IdentityRole<Guid> { Id = studentRole, Name = "Student" });
            Db.Roles.Add(new IdentityRole<Guid> { Id = adminRole, Name = "Admin" });
            Db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = StudentId, RoleId = studentRole });
            Db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = AdminId, RoleId = adminRole });
            Db.Set<LearningProgramCategory>().Add(new LearningProgramCategory { Id = categoryId, Name = "Tech", Slug = "tech" });
            Db.LearningPrograms.Add(new LearningProgram
            {
                Id = ProgramId, CategoryId = categoryId, Title = "Science", Slug = "science", Status = ProgramStatus.Published,
                Plans =
                [
                    new ProgramPlan { Id = LaunchPlanId, ProgramId = ProgramId, Name = "Launch", Code = "SELF", IsActive = true, OfferPrice = 7999, ActualPrice = 7999 },
                    new ProgramPlan { Id = MasteryPlanId, ProgramId = ProgramId, Name = "Mastery", Code = "MASTER", IsActive = true, OfferPrice = 14999, ActualPrice = 14999 },
                ]
            });
            Db.SaveChanges();

            var gateway = new Mock<IPaymentGateway>();
            gateway.Setup(x => x.CreateOrderAsync(It.IsAny<Guid>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<DateTimeOffset>(),
                    It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid id, decimal amount, string currency, DateTimeOffset expires, string? _, string? _, string? _, string? _, CancellationToken _) =>
                {
                    OrdersCreated++;
                    return new PaymentGatewayOrder("Cashfree", "key", $"joviq_{id:N}", (long)(amount * 100), currency, expires, $"session_{id:N}", "sandbox");
                });
            gateway.Setup(x => x.VerifyPaymentAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((string orderId, string? _, string? _, CancellationToken _) =>
                    _paidOrders.TryGetValue(orderId, out var paymentId)
                        ? new PaymentGatewayVerification(true, paymentId)
                        : new PaymentGatewayVerification(false));
            var clock = new Mock<IDateTimeProvider>();
            clock.SetupGet(x => x.UtcNow).Returns(() => Now);
            Service = new LmsPortalService(Db, clock.Object, Mock.Of<IAuditLogService>(), Mock.Of<ICurrentUserService>(), gateway.Object,
                Options.Create(new PaymentOptions { Provider = "Cashfree", CheckoutExpiryMinutes = 15 }),
                new ConfigurationBuilder().Build(), Mock.Of<IAdminUserService>());
        }

        public Task<PaymentCheckoutResponse> Checkout(PaymentMode mode, Guid? planId = null) =>
            Service.CreatePaymentCheckoutAsync(StudentId, new CreatePaymentCheckoutRequest
            {
                ProgramId = ProgramId, ProgramPlanId = planId ?? LaunchPlanId, Mode = mode
            }, default);

        public void Pay(string orderId) => _paidOrders[orderId] = $"cf_{_paidOrders.Count + 1}";

        public Task<PaymentTransactionResponse> Verify(PaymentCheckoutResponse checkout) =>
            Service.VerifyPaymentAsync(StudentId, new VerifyPaymentLmsRequest
            {
                PaymentTransactionId = checkout.Transaction.Id, GatewayOrderId = checkout.GatewayOrderId
            }, default);

        public Task Webhook(string orderId) => Service.ProcessCashfreePaymentWebhookAsync(
            System.Text.Json.JsonSerializer.Serialize(new
            {
                type = "PAYMENT_SUCCESS_WEBHOOK",
                data = new { order = new { order_id = orderId }, payment = new { cf_payment_id = _paidOrders[orderId], payment_status = "SUCCESS" } }
            }), default);

        public Enrollment Enrollment() => Db.Enrollments.AsNoTracking().Single();

        public PaymentTransaction Transaction(PaymentCheckoutResponse checkout) =>
            Db.PaymentTransactions.AsNoTracking().Single(x => x.Id == checkout.Transaction.Id);

        public void Dispose() => Db.Dispose();
    }
}
