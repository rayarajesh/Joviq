using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task LoginWithoutPasswordAsksStudentToSetOneWithoutCountingFailure()
    {
        using var fixture = new Fixture(hasPassword: false);

        var error = await Assert.ThrowsAsync<AppException>(() => fixture.Service.LoginAsync(
            new LoginRequest { Email = fixture.User.Email!, Password = "Anything1!" }, Fixture.Metadata, CancellationToken.None));

        Assert.Equal("password_not_set", error.ErrorCode);
        fixture.Users.Verify(x => x.AccessFailedAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task GoogleLinkToUnverifiedAccountRemovesPasswordAndSessions()
    {
        using var fixture = new Fixture(hasPassword: true);

        await fixture.Service.ExternalLoginAsync(new ExternalLoginRequest
        {
            Provider = "Google", ProviderKey = "google-user", Email = fixture.User.Email!, EmailVerified = true
        }, Fixture.Metadata, CancellationToken.None);

        fixture.Users.Verify(x => x.RemovePasswordAsync(fixture.User), Times.Once);
        fixture.Sessions.Verify(x => x.RevokeAllAsync(fixture.User.Id, It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.True(fixture.User.EmailConfirmed);
        Assert.Equal(AccountStatus.Active, fixture.User.AccountStatus);
    }

    private sealed class Fixture : IDisposable
    {
        public static readonly RequestMetadata Metadata = new("127.0.0.1", "tests", null, null);
        public ApplicationDbContext Db { get; }
        public ApplicationUser User { get; } = new()
        {
            Id = Guid.NewGuid(), FullName = "Test Student", Email = "student@example.test", UserName = "student@example.test",
            PhoneNumber = "9876543210", AccountStatus = AccountStatus.PendingEmailVerification
        };
        public Mock<UserManager<ApplicationUser>> Users { get; }
        public Mock<IRefreshTokenService> Sessions { get; } = new();
        public AuthService Service { get; }

        public Fixture(bool hasPassword)
        {
            Db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options);

            Users = new Mock<UserManager<ApplicationUser>>(Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);
            Users.Setup(x => x.FindByEmailAsync(User.Email!)).ReturnsAsync(User);
            Users.Setup(x => x.FindByLoginAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
            Users.Setup(x => x.IsLockedOutAsync(User)).ReturnsAsync(false);
            Users.Setup(x => x.HasPasswordAsync(User)).ReturnsAsync(hasPassword);
            Users.Setup(x => x.RemovePasswordAsync(User)).ReturnsAsync(IdentityResult.Success);
            Users.Setup(x => x.UpdateSecurityStampAsync(User)).ReturnsAsync(IdentityResult.Success);
            Users.Setup(x => x.AddLoginAsync(User, It.IsAny<UserLoginInfo>())).ReturnsAsync(IdentityResult.Success);
            Users.Setup(x => x.GetRolesAsync(User)).ReturnsAsync(["Student"]);

            Sessions.Setup(x => x.CreateSessionAsync(User.Id, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<RequestMetadata>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new UserSession { Id = Guid.NewGuid(), UserId = User.Id, ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) }, "refresh"));
            var jwt = new Mock<IJwtTokenService>();
            jwt.Setup(x => x.CreateAccessTokenAsync(User.Id, It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(("access", 900));
            var clock = new Mock<IDateTimeProvider>();
            clock.SetupGet(x => x.UtcNow).Returns(DateTimeOffset.UtcNow);
            var protection = new Mock<IDataProtectionProvider>();
            protection.Setup(x => x.CreateProtector(It.IsAny<string>())).Returns(Mock.Of<IDataProtector>());

            Service = new AuthService(Users.Object, Db, jwt.Object, Sessions.Object, Mock.Of<IOtpService>(),
                Mock.Of<IEmailSender>(), clock.Object, protection.Object, NullLogger<AuthService>.Instance);
        }

        public void Dispose() => Db.Dispose();
    }
}
