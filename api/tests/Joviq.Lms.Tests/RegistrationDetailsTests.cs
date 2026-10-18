using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Students;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class RegistrationDetailsTests
{
    [Fact]
    public async Task CollegeAndExecutivePersistAndOlderClientsPreserveThem()
    {
        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var id = Guid.NewGuid();
        db.Users.Add(new ApplicationUser { Id = id, FullName = "Student", Email = "student@example.com", UserName = "student@example.com" });
        db.StudentProfiles.Add(new StudentProfile { UserId = id });
        await db.SaveChangesAsync();
        var clock = new Mock<IDateTimeProvider>();
        clock.SetupGet(x => x.UtcNow).Returns(new DateTimeOffset(2026, 10, 17, 0, 0, 0, TimeSpan.Zero));
        var service = new StudentOnboardingService(db, clock.Object);
        var request = new UpdateRegistrationDetailsRequest {
            FullName = "Test Student", PhoneNumber = "9876543210", WhatsAppNumber = "9876543210",
            CollegeName = "  Example College  ", ExecutiveName = "  Example Executive  ",
            CategoryName = "Technology", ProgramSlug = "test-course", ProgramTitle = "Test Course",
            CurrentYearOfStudy = "2nd Year", StartDate = new DateOnly(2026, 11, 1)
        };
        await service.UpdateRegistrationDetailsAsync(id, request, CancellationToken.None);
        db.ChangeTracker.Clear();
        var saved = await service.GetAsync(id, CancellationToken.None);
        Assert.Equal("Example College", saved.Academic.College);
        Assert.Equal("Example Executive", saved.Registration.ExecutiveName);
        var olderClient = request with { CollegeName = null, ExecutiveName = null };
        await service.UpdateRegistrationDetailsAsync(id, olderClient, CancellationToken.None);
        db.ChangeTracker.Clear();
        saved = await service.GetAsync(id, CancellationToken.None);
        Assert.Equal("Example College", saved.Academic.College);
        Assert.Equal("Example Executive", saved.Registration.ExecutiveName);
        await Assert.ThrowsAsync<ValidationAppException>(() => service.UpdateRegistrationDetailsAsync(
            id, request with { ExecutiveName = " " }, CancellationToken.None));
    }
}
