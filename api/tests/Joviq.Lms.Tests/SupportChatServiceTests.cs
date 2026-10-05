using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Support;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class SupportChatServiceTests
{
    [Fact]
    public async Task StudentMessageShowsAsUnreadUntilAdminOpensChat()
    {
        using var fixture = new Fixture();
        await fixture.Service.SendStudentMessageAsync(fixture.StudentId, Text("Payment done but course locked"), CancellationToken.None);

        var chat = Assert.Single(await fixture.Service.GetConversationsAsync(null, CancellationToken.None));
        Assert.Equal(1, chat.UnreadCount);
        Assert.Equal("Payment done but course locked", chat.LastMessage);
        Assert.Equal(1, (await fixture.Service.GetAdminUnreadAsync(CancellationToken.None)).UnreadCount);

        var conversation = await fixture.Service.GetConversationAsync(fixture.StudentId, CancellationToken.None);
        Assert.Equal("Test Student", conversation.StudentName);
        Assert.NotNull(Assert.Single(fixture.Db.SupportMessages).ReadAt);
        Assert.Single(conversation.Messages);
        Assert.Equal(0, (await fixture.Service.GetAdminUnreadAsync(CancellationToken.None)).UnreadCount);
    }

    [Fact]
    public async Task AdminRepliesNotifyStudentOnceUntilRead()
    {
        using var fixture = new Fixture();
        await fixture.Service.SendAdminMessageAsync(fixture.AdminId, fixture.StudentId, Text("Hi, checking now"), CancellationToken.None);
        await fixture.Service.SendAdminMessageAsync(fixture.AdminId, fixture.StudentId, Text("Fixed it"), CancellationToken.None);

        Assert.Single(fixture.Db.Notifications);
        Assert.Equal(2, (await fixture.Service.GetStudentUnreadAsync(fixture.StudentId, CancellationToken.None)).UnreadCount);

        var messages = await fixture.Service.GetStudentMessagesAsync(fixture.StudentId, CancellationToken.None);
        Assert.All(messages, message => Assert.Equal("Joviq Support", message.SenderName));
        Assert.Equal(0, (await fixture.Service.GetStudentUnreadAsync(fixture.StudentId, CancellationToken.None)).UnreadCount);
    }

    [Fact]
    public async Task RejectsEmptyMessagesAndOtherPeoplesFiles()
    {
        using var fixture = new Fixture();
        var foreignAsset = new Asset
        {
            Id = Guid.NewGuid(), OwnerUserId = fixture.AdminId, OriginalFileName = "x.png", ContentType = "image/png",
            Type = AssetType.Image, Purpose = AssetPurpose.SupportAttachment, Status = AssetStatus.Ready
        };
        fixture.Db.Assets.Add(foreignAsset);
        await fixture.Db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            fixture.Service.SendStudentMessageAsync(fixture.StudentId, Text("   "), CancellationToken.None));
        await Assert.ThrowsAsync<ValidationAppException>(() => fixture.Service.SendStudentMessageAsync(
            fixture.StudentId, new SendSupportMessageRequest { AttachmentAssetId = foreignAsset.Id }, CancellationToken.None));
        Assert.Empty(fixture.Db.SupportMessages);
    }

    [Fact]
    public async Task AdminCannotMessageNonStudent()
    {
        using var fixture = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() =>
            fixture.Service.SendAdminMessageAsync(fixture.AdminId, fixture.AdminId, Text("hello"), CancellationToken.None));
        Assert.Equal("student_not_found", error.ErrorCode);
    }

    private static SendSupportMessageRequest Text(string body) => new() { Body = body };

    private sealed class Fixture : IDisposable
    {
        public ApplicationDbContext Db { get; }
        public Guid StudentId { get; } = Guid.NewGuid();
        public Guid AdminId { get; } = Guid.NewGuid();
        public SupportChatService Service { get; }

        public Fixture()
        {
            Db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options);
            var studentRoleId = Guid.NewGuid();
            var adminRoleId = Guid.NewGuid();
            Db.Users.Add(new ApplicationUser { Id = StudentId, FullName = "Test Student", Email = "student@example.test" });
            Db.Users.Add(new ApplicationUser { Id = AdminId, FullName = "Admin One", Email = "admin@example.test" });
            Db.Roles.Add(new IdentityRole<Guid> { Id = studentRoleId, Name = "Student" });
            Db.Roles.Add(new IdentityRole<Guid> { Id = adminRoleId, Name = "Admin" });
            Db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = StudentId, RoleId = studentRoleId });
            Db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = AdminId, RoleId = adminRoleId });
            Db.SaveChanges();

            var clock = new Mock<IDateTimeProvider>();
            clock.SetupGet(x => x.UtcNow).Returns(() => DateTimeOffset.UtcNow);
            Service = new SupportChatService(Db, clock.Object);
        }

        public void Dispose() => Db.Dispose();
    }
}
