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

public sealed class AdminEnrollmentTests
{
    [Theory]
    [InlineData("full", 4000, 4000, true)]
    [InlineData("token", 1500, 1500, true)]
    [InlineData("other", 2300, 2300, true)]
    [InlineData("other", 2300, 2400, false)]
    [InlineData("full", 1500, 1500, false)]
    [InlineData("token", 1000, 1000, false)]
    [InlineData("other", 1500, 0, false)]
    [InlineData("other", 1500, -1, false)]
    public async Task EnteredAmountAndPaymentTypeMustMatchCashfree(string kind, int verified, int entered, bool valid)
    {
        using var fixture = new Fixture(verified);
        var request = fixture.Request(amountPaid: entered, kind: kind);
        if (!valid)
        {
            await Assert.ThrowsAsync<ValidationAppException>(() => fixture.Service.CreateAdminEnrollmentAsync(request, CancellationToken.None));
            Assert.Empty(fixture.Db.PaymentTransactions);
            return;
        }
        var result = await fixture.Service.CreateAdminEnrollmentAsync(request, CancellationToken.None);
        Assert.Equal(entered, result.PaidAmount);
        Assert.Equal(4000 - entered, result.BalanceAmount);
        Assert.Equal(kind == "full", result.HasFullAccess);
        Assert.Equal(kind == "full" ? PaymentMode.PayInFull : PaymentMode.ReserveSeat,
            Assert.Single(fixture.Db.PaymentTransactions).Mode);
    }

    [Theory]
    [InlineData(4000, true)]
    [InlineData(1500, false)]
    public async Task VerifiedPaymentUpdatesBalanceAndAccess(int amount, bool fullAccess)
    {
        using var fixture = new Fixture(amount);
        var result = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None);
        Assert.Equal(amount, result.PaidAmount);
        Assert.Equal(4000 - amount, result.BalanceAmount);
        Assert.Equal(fullAccess, result.HasFullAccess);
        Assert.NotNull(result.AccessExpiresAt);
        var payment = Assert.Single(fixture.Db.PaymentTransactions);
        Assert.Equal(PaymentStatus.Verified, payment.Status);
        Assert.NotNull(payment.InvoiceNumber);
    }

    [Theory]
    [InlineData("other@example.test", "1111111111", "INR", 4000)]
    [InlineData("student@example.test", "9876543210", "USD", 4000)]
    [InlineData("student@example.test", "9876543210", "INR", 8000)]
    [InlineData("student@example.test", "9876543210", "INR", 0)]
    public async Task RejectsWrongCustomerCurrencyOrOverpayment(string email, string phone, string currency, int amount)
    {
        using var fixture = new Fixture(amount, email, phone, currency);
        await Assert.ThrowsAsync<ValidationAppException>(() => fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None));
        Assert.Empty(fixture.Db.PaymentTransactions);
    }

    [Fact]
    public async Task UnpaidEnrollmentDoesNotUnlockAccess()
    {
        using var fixture = new Fixture(4000);
        var request = fixture.Request(false);
        var result = await fixture.Service.CreateAdminEnrollmentAsync(request, CancellationToken.None);
        Assert.False(result.HasFullAccess);
        Assert.Equal(0, result.PaidAmount);
        Assert.Empty(fixture.Db.PaymentTransactions);
    }

    [Fact]
    public async Task ExistingEnrollmentCanBeSavedWithoutPaymentDetails()
    {
        using var fixture = new Fixture(4000);
        var initial = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(false), CancellationToken.None);
        var result = await fixture.Service.CreateAdminEnrollmentAsync(new AdminEnrollmentRequest
        {
            EnrollmentId = initial.Id,
            StudentId = fixture.StudentId,
            ProgramId = fixture.ProgramId,
            ProgramPlanId = fixture.PlanId,
            PaymentEnvironment = "sandbox"
        }, CancellationToken.None);

        Assert.Equal(initial.Id, result.Id);
        Assert.Equal(0, result.PaidAmount);
        Assert.Empty(fixture.Db.PaymentTransactions);
    }

    [Fact]
    public async Task ExistingEnrollmentEditCanChangeProgramPlanAndStartDate()
    {
        using var fixture = new Fixture(4000);
        var initial = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(false), CancellationToken.None);
        var startDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));

        var result = await fixture.Service.CreateAdminEnrollmentAsync(new AdminEnrollmentRequest
        {
            EnrollmentId = initial.Id,
            StudentId = fixture.StudentId,
            ProgramId = fixture.SecondProgramId,
            ProgramPlanId = fixture.SecondPlanId,
            StartDate = startDate,
            PaymentEnvironment = "sandbox"
        }, CancellationToken.None);

        Assert.Equal(fixture.SecondProgramId, result.ProgramId);
        Assert.Equal(fixture.SecondPlanId, result.ProgramPlanId);
        Assert.Equal(startDate, result.StartDate);
        Assert.Equal(0, result.PaidAmount);
    }

    [Fact]
    public async Task ManualPaymentCanBeRecordedWithoutCashfreeOrderId()
    {
        using var fixture = new Fixture(4000);
        var result = await fixture.Service.CreateAdminEnrollmentAsync(new AdminEnrollmentRequest
        {
            StudentId = fixture.StudentId,
            ProgramId = fixture.ProgramId,
            ProgramPlanId = fixture.PlanId,
            PaymentEnvironment = "sandbox",
            PaymentKind = "other",
            AmountPaid = 2300,
            CashfreePaymentId = "manual-payment",
            CashfreeLinkId = "manual-link",
            Notes = "Cash payment recorded by admin."
        }, CancellationToken.None);

        var payment = Assert.Single(fixture.Db.PaymentTransactions);
        Assert.Null(payment.GatewayOrderId);
        Assert.Equal("manual-payment", payment.GatewayPaymentId);
        Assert.Equal("manual-link", payment.GatewayLinkId);
        Assert.Equal("Cash payment recorded by admin.", payment.Notes);
        Assert.Equal(2300, result.PaidAmount);
    }

    [Fact]
    public async Task ExistingPaymentMetadataCanBeEditedWithoutCreatingAnotherPayment()
    {
        using var fixture = new Fixture(1500);
        var initial = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None);
        var payment = Assert.Single(fixture.Db.PaymentTransactions);
        var result = await fixture.Service.CreateAdminEnrollmentAsync(new AdminEnrollmentRequest
        {
            EnrollmentId = initial.Id,
            PaymentTransactionId = payment.Id,
            StudentId = fixture.StudentId,
            ProgramId = fixture.ProgramId,
            ProgramPlanId = fixture.PlanId,
            PaymentEnvironment = "sandbox",
            CashfreeLinkId = "updated-link",
            Notes = "Updated payment note."
        }, CancellationToken.None);

        var updatedPayment = Assert.Single(fixture.Db.PaymentTransactions);
        Assert.Equal(1500, result.PaidAmount);
        Assert.Null(updatedPayment.GatewayOrderId);
        Assert.Null(updatedPayment.GatewayPaymentId);
        Assert.Equal("updated-link", updatedPayment.GatewayLinkId);
        Assert.Equal("Updated payment note.", updatedPayment.Notes);
    }

    [Fact]
    public async Task CannotReusePaymentOrDuplicateEnrollment()
    {
        using var fixture = new Fixture(1500);
        var result = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None);
        await Assert.ThrowsAsync<AppException>(() => fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None));
        var repeat = fixture.Request();
        var record = new AdminEnrollmentRequest
        {
            EnrollmentId = result.Id, StudentId = repeat.StudentId, ProgramId = repeat.ProgramId,
            ProgramPlanId = repeat.ProgramPlanId, CashfreeOrderId = repeat.CashfreeOrderId, PaymentEnvironment = "sandbox"
        };
        await Assert.ThrowsAsync<AppException>(() => fixture.Service.CreateAdminEnrollmentAsync(record, CancellationToken.None));
        Assert.Single(fixture.Db.PaymentTransactions);
        Assert.Equal(1500, (await fixture.Db.Enrollments.SingleAsync()).PaidAmount);
    }

    [Fact]
    public async Task CannotSelectProductionPaymentsOnSandboxServer()
    {
        using var fixture = new Fixture(4000);
        await Assert.ThrowsAsync<ValidationAppException>(() => fixture.Service.CreateAdminEnrollmentAsync(new AdminEnrollmentRequest
        { PaymentEnvironment = "production" }, CancellationToken.None));
        Assert.Empty(fixture.Db.Enrollments);
    }

    [Fact]
    public async Task RecordingBalancePaymentUnlocksAnExistingEnrollment()
    {
        using var fixture = new Fixture(1500);
        var first = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None);
        fixture.Gateway.Setup(x => x.VerifyExternalPaymentAsync("balance-order", It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ExternalPaymentVerification("balance-payment", 2500, "INR", "student@example.test", "9876543210"));
        var request = fixture.Request();
        var result = await fixture.Service.CreateAdminEnrollmentAsync(new AdminEnrollmentRequest
        {
            EnrollmentId = first.Id, StudentId = request.StudentId, ProgramId = request.ProgramId,
            ProgramPlanId = request.ProgramPlanId, CashfreeOrderId = "balance-order", PaymentEnvironment = "sandbox"
        }, CancellationToken.None);
        Assert.Equal(4000, result.PaidAmount);
        Assert.Equal(0, result.BalanceAmount);
        Assert.True(result.HasFullAccess);
        Assert.Equal(2, fixture.Db.PaymentTransactions.Count());
        Assert.Single(fixture.Db.Enrollments);
    }

    [Fact]
    public async Task AdminCanChangeExistingEnrollmentProgramAndKeepPaymentLinked()
    {
        using var fixture = new Fixture(1500);
        var initial = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None);

        var result = await fixture.Service.ChangeEnrollmentProgramAsync(initial.Id, new ChangeEnrollmentProgramRequest
        {
            ProgramId = fixture.SecondProgramId,
            ProgramPlanId = fixture.SecondPlanId,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10))
        }, CancellationToken.None);

        Assert.Equal(fixture.SecondProgramId, result.ProgramId);
        Assert.Equal(fixture.SecondPlanId, result.ProgramPlanId);
        Assert.Equal(1500, result.PaidAmount);
        Assert.Equal(fixture.SecondProgramId, (await fixture.Db.PaymentTransactions.SingleAsync()).ProgramId);
        Assert.Equal(fixture.SecondPlanId, (await fixture.Db.PaymentTransactions.SingleAsync()).ProgramPlanId);
    }

    [Fact]
    public async Task StudentCanCompletePaidRegistrationAndMoveEnrollmentToSelectedProgram()
    {
        using var fixture = new Fixture(1500);
        var initial = await fixture.Service.CreateAdminEnrollmentAsync(fixture.Request(), CancellationToken.None);
        var payment = await fixture.Db.PaymentTransactions.SingleAsync();

        var result = await fixture.Service.CompletePaidEnrollmentRegistrationAsync(
            fixture.StudentId,
            payment.Id,
            new ChangeEnrollmentProgramRequest
            {
                ProgramId = fixture.SecondProgramId,
                ProgramPlanId = fixture.SecondPlanId,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10))
            },
            CancellationToken.None);

        Assert.Equal(initial.Id, result.Id);
        Assert.Equal(fixture.SecondProgramId, result.ProgramId);
        Assert.Equal(fixture.SecondPlanId, result.ProgramPlanId);
        Assert.Equal(fixture.SecondProgramId, payment.ProgramId);
        Assert.Equal(fixture.SecondPlanId, payment.ProgramPlanId);
        Assert.Equal(1500, result.PaidAmount);
        Assert.False(result.HasFullAccess);
    }

    private sealed class Fixture : IDisposable
    {
        public ApplicationDbContext Db { get; }
        public LmsPortalService Service { get; }
        public Mock<IPaymentGateway> Gateway { get; } = new();
        public Guid StudentId { get; } = Guid.NewGuid();
        public Guid ProgramId { get; } = Guid.NewGuid();
        public Guid PlanId { get; } = Guid.NewGuid();
        public Guid SecondProgramId { get; } = Guid.NewGuid();
        public Guid SecondPlanId { get; } = Guid.NewGuid();

        public Fixture(decimal amount, string email = "student@example.test", string phone = "9876543210", string currency = "INR")
        {
            Db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options);
            var roleId = Guid.NewGuid();
            Db.Users.Add(new ApplicationUser { Id = StudentId, FullName = "Test Student", Email = "student@example.test",
                PhoneNumber = "9876543210", AccountStatus = AccountStatus.Active });
            Db.Roles.Add(new IdentityRole<Guid> { Id = roleId, Name = "Student" });
            Db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = StudentId, RoleId = roleId });
            Db.LearningPrograms.Add(new LearningProgram { Id = ProgramId, Title = "Science", Slug = "science",
                Status = ProgramStatus.Published, Plans = [new ProgramPlan { Id = PlanId, ProgramId = ProgramId,
                    Name = "Launch", Code = "SELF", IsActive = true, OfferPrice = 4000, ActualPrice = 4000 }] });
            Db.LearningPrograms.Add(new LearningProgram { Id = SecondProgramId, Title = "Technology", Slug = "technology",
                Status = ProgramStatus.Published, Plans = [new ProgramPlan { Id = SecondPlanId, ProgramId = SecondProgramId,
                    Name = "Launch", Code = "SELF", IsActive = true, OfferPrice = 4000, ActualPrice = 4000 }] });
            Db.SaveChanges();
            Gateway.Setup(x => x.VerifyExternalPaymentAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ExternalPaymentVerification("payment-test", amount, currency, email, phone));
            var clock = new Mock<IDateTimeProvider>();
            clock.SetupGet(x => x.UtcNow).Returns(DateTimeOffset.UtcNow);
            Service = new LmsPortalService(Db, clock.Object, Mock.Of<IAuditLogService>(), Mock.Of<ICurrentUserService>(),
                Gateway.Object, Options.Create(new PaymentOptions { Provider = "Cashfree", CashfreeEnvironment = "sandbox" }),
                new ConfigurationBuilder().Build(), Mock.Of<IAdminUserService>());
        }

        public AdminEnrollmentRequest Request(bool paid = true, decimal? amountPaid = null, string? kind = null) => new()
        {
            StudentId = StudentId, ProgramId = ProgramId, ProgramPlanId = PlanId,
            PaymentEnvironment = "sandbox", CashfreeOrderId = paid ? "order-test" : null,
            AmountPaid = amountPaid, PaymentKind = kind
        };

        public void Dispose() => Db.Dispose();
    }
}
