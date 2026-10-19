using System.Reflection;
using Joviq.Lms.Api.Controllers;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Students;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Tests;

public sealed class OnboardingSubmissionTests
{
    private sealed class Clock : IDateTimeProvider { public DateTimeOffset UtcNow => new(2026, 10, 19, 12, 0, 0, TimeSpan.Zero); }
    private static ApplicationDbContext CreateDb() => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static UpdateRegistrationDetailsRequest ValidRequest() => new()
    {
        FullName = "Sample Student", PhoneNumber = "9876543210", WhatsAppNumber = "9876543211",
        CollegeName = "Sample College", ExecutiveName = "Sample Executive", CurrentYearOfStudy = "Third year",
        CategoryName = "Computer Science", ProgramSlug = "data-science", ProgramTitle = "Data Science",
        StartDate = new DateOnly(2026, 11, 1)
    };

    [Fact]
    public async Task SubmissionUpdatesSingleProfileAndAppearsWithLinkedUserDetails()
    {
        await using var db = CreateDb();
        var user = new ApplicationUser { Id = Guid.NewGuid(), FullName = "Before", Email = "student@example.test" };
        var other = new ApplicationUser { Id = Guid.NewGuid(), FullName = "Other", Email = "other@example.test" };
        db.Users.AddRange(user, other);
        db.StudentProfiles.Add(new StudentProfile { UserId = other.Id });
        await db.SaveChangesAsync();
        var service = new StudentOnboardingService(db, new Clock());
        await service.UpdateRegistrationDetailsAsync(user.Id, ValidRequest(), default);
        var admin = new AdminOnboardingService(db);
        var result = await admin.ListAsync(new AdminOnboardingRequest { Search = "STUDENT@", Category = "Computer Science", Program = "data-science", Status = "Submitted" }, default);
        var item = Assert.Single(result.Items);
        Assert.Equal(user.Id, item.UserId);
        Assert.Equal("Sample Student", item.StudentName);
        Assert.Equal(user.Email, item.StudentEmail);
        Assert.Equal("Sample College", item.CollegeName);
        Assert.Equal("9876543211", item.WhatsAppNumber);
        Assert.Equal(new Clock().UtcNow, item.SubmittedAt);
        await admin.UpdateStatusAsync(user.Id, "Approved", default);
        Assert.Equal("Approved", (await admin.GetAsync(user.Id, default)).Status);
        Assert.NotEqual(OnboardingStatus.Completed, user.OnboardingStatus);
        await service.UpdateRegistrationDetailsAsync(user.Id, ValidRequest() with { ExecutiveName = "Updated Executive" }, default);
        Assert.Equal(1, await db.StudentProfiles.CountAsync(x => x.UserId == user.Id));
        Assert.Equal("Submitted", (await admin.GetAsync(user.Id, default)).Status);
        Assert.Equal("Updated Executive", (await admin.GetAsync(user.Id, default)).ExecutiveName);
        Assert.Null((await db.StudentProfiles.SingleAsync(x => x.UserId == other.Id)).OnboardingSubmittedAt);
        Assert.Equal("Other", other.FullName);
        Assert.Empty((await admin.ListAsync(new AdminOnboardingRequest { Search = "does not exist" }, default)).Items);
        Assert.Single((await admin.FiltersAsync(default)).Programs);
    }

    [Theory]
    [InlineData("college")]
    [InlineData("executive")]
    [InlineData("phone")]
    [InlineData("whatsapp")]
    [InlineData("name")]
    [InlineData("year")]
    [InlineData("category")]
    [InlineData("program")]
    [InlineData("date")]
    public async Task InvalidSubmissionIsNotPersisted(string field)
    {
        await using var db = CreateDb();
        var user = new ApplicationUser { Id = Guid.NewGuid(), FullName = "Before", Email = "student@example.test" };
        db.Users.Add(user); await db.SaveChangesAsync();
        var input = field switch
        {
            "college" => ValidRequest() with { CollegeName = "" },
            "executive" => ValidRequest() with { ExecutiveName = null },
            "phone" => ValidRequest() with { PhoneNumber = "123" },
            "whatsapp" => ValidRequest() with { WhatsAppNumber = "" },
            "name" => ValidRequest() with { FullName = "" },
            "year" => ValidRequest() with { CurrentYearOfStudy = "" },
            "category" => ValidRequest() with { CategoryName = "" },
            "program" => ValidRequest() with { ProgramSlug = "" },
            _ => ValidRequest() with { StartDate = new DateOnly(2020, 1, 1) }
        };
        await Assert.ThrowsAsync<ValidationAppException>(() => new StudentOnboardingService(db, new Clock()).UpdateRegistrationDetailsAsync(user.Id, input, default));
        db.ChangeTracker.Clear();
        Assert.Empty(await db.StudentProfiles.ToListAsync());
        Assert.Equal("Before", (await db.Users.SingleAsync()).FullName);
    }

    [Fact]
    public async Task StatusRejectsUnknownValuesAndUnsubmittedProfiles()
    {
        await using var db = CreateDb();
        var service = new AdminOnboardingService(db);
        await Assert.ThrowsAsync<AppException>(() => service.UpdateStatusAsync(Guid.NewGuid(), "Completed", default));
        await Assert.ThrowsAsync<AppException>(() => service.GetAsync(Guid.NewGuid(), default));
    }

    [Fact]
    public void ControllersRequireServerSideRolePolicies()
    {
        Assert.Equal("AdminOnly", typeof(AdminOnboardingController).GetCustomAttribute<AuthorizeAttribute>()!.Policy);
        Assert.Equal("StudentOnly", typeof(StudentOnboardingController).GetCustomAttribute<AuthorizeAttribute>()!.Policy);
        Assert.DoesNotContain(typeof(UpdateRegistrationDetailsRequest).GetProperties(), p => p.Name == "UserId");
    }
}
