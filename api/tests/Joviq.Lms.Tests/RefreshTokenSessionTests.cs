using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class RefreshTokenSessionTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(60)]
    public async Task LoginReusesActiveSessionInsteadOfRevokedHistory(int historySecondsLater)
    {
        await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var now = DateTimeOffset.UtcNow;
        var userId = Guid.NewGuid();
        var revoked = new UserSession { Id = Guid.NewGuid(), UserId = userId, DeviceId = "browser-test",
            RefreshTokenHash = "old", JwtId = "old-jwt", LastSeenAt = now.AddSeconds(historySecondsLater), RevokedAt = now };
        var active = new UserSession { Id = Guid.NewGuid(), UserId = userId, DeviceId = "browser-test",
            RefreshTokenHash = "active", JwtId = "active-jwt", LastSeenAt = now, ExpiresAt = now.AddDays(1) };
        db.UserSessions.AddRange(revoked, active);
        await db.SaveChangesAsync();
        var clock = new Mock<IDateTimeProvider>();
        clock.SetupGet(x => x.UtcNow).Returns(now);
        var service = new RefreshTokenService(db, clock.Object, Options.Create(new RefreshTokenOptions()));
        var result = await service.CreateSessionAsync(userId, "new-jwt", false,
            new RequestMetadata("127.0.0.1", "Test browser", "Test browser", "browser-test"), default);
        Assert.Equal(active.Id, result.Session.Id);
        Assert.NotNull(revoked.RevokedAt);
        Assert.Single(await db.UserSessions.Where(x => x.UserId == userId && x.RevokedAt == null).ToListAsync());
        Assert.Equal("new-jwt", active.JwtId);
        Assert.NotEqual("active", active.RefreshTokenHash);
    }
}
