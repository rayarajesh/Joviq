using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Joviq.Lms.Tests;

public sealed class TestAccountSeederTests
{
    [Fact]
    public async Task SeedsOnlyDesignatedAccountsAndOneFreeCourseWithoutPaymentsOrRealAdminReset()
    {
        var settings = new Dictionary<string, string?>
        {
            ["TestAccounts:Enabled"] = "true", ["TestAccounts:AdminPassword"] = "TestAdmin!12345",
            ["TestAccounts:StudentPassword"] = "TestStudent!12345", ["SeedAdmin:Email"] = "real-admin@example.test"
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var services = new ServiceCollection().AddLogging().AddSingleton<IConfiguration>(configuration);
        services.AddDataProtection();
        var databaseName = Guid.NewGuid().ToString();
        services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(databaseName)
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning)));
        services.AddIdentityCore<ApplicationUser>().AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        await roles.CreateAsync(new IdentityRole<Guid>("Admin"));
        await roles.CreateAsync(new IdentityRole<Guid>("Student"));
        var realAdmin = new ApplicationUser { Id = Guid.NewGuid(), UserName = "real-admin@example.test", Email = "real-admin@example.test" };
        Assert.True((await users.CreateAsync(realAdmin, "RealAdmin!67890")).Succeeded);
        await users.AddToRoleAsync(realAdmin, "Admin");
        var hash = realAdmin.PasswordHash;
        db.LearningPrograms.Add(new LearningProgram { Id = Guid.NewGuid(), Slug = "data-science", Status = ProgramStatus.Published,
            Plans = [new ProgramPlan { Id = Guid.NewGuid(), Code = "SELF", IsActive = true, OfferPrice = 7999 }] });
        await db.SaveChangesAsync();

        await TestAccountSeeder.SeedAsync(provider);
        await TestAccountSeeder.SeedAsync(provider);
        db.ChangeTracker.Clear();
        var student = await users.FindByEmailAsync(TestAccountSeeder.StudentEmail);
        Assert.NotNull(student);
        Assert.True(await users.CheckPasswordAsync(student, "TestStudent!12345"));
        Assert.True(await users.IsInRoleAsync(student, "Student"));
        Assert.Equal(OnboardingStatus.Completed, student.OnboardingStatus);
        var admin = await users.FindByEmailAsync(TestAccountSeeder.AdminEmail);
        Assert.NotNull(admin);
        Assert.True(await users.IsInRoleAsync(admin, "Admin"));
        Assert.Equal(hash, (await users.FindByEmailAsync(realAdmin.Email!))!.PasswordHash);
        var enrollment = Assert.Single(await db.Enrollments.ToListAsync());
        Assert.Equal(student.Id, enrollment.StudentId);
        Assert.Equal(EnrollmentStatus.Active, enrollment.Status);
        Assert.Equal(0, enrollment.PaidAmount);
        Assert.Equal(enrollment.TotalAmount, enrollment.DiscountAmount);
        Assert.NotNull(enrollment.FullAccessUnlockedAt);
        Assert.NotNull(enrollment.AccessExpiresAt);
        Assert.Empty(db.PaymentTransactions);
        Assert.Single(await db.AuthAuditLogs.Where(x => x.EventType == "Seed.TestStudent.CourseFeeWaived").ToListAsync());
    }
}
