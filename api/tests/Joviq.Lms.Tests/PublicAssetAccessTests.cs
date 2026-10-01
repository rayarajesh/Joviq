using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services.Assets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;

namespace Joviq.Lms.Tests;

public class PublicAssetAccessTests
{
    [Theory]
    [InlineData(AssetVisibility.Private, AssetStatus.Ready, false)]
    [InlineData(AssetVisibility.Public, AssetStatus.PendingUpload, false)]
    [InlineData(AssetVisibility.Public, AssetStatus.Deleted, false)]
    [InlineData(AssetVisibility.Public, AssetStatus.Ready, true)]
    public async Task PublicEndpointOnlySignsReadyPublicAssets(AssetVisibility visibility, AssetStatus status, bool allowed)
    {
        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var asset = new Asset
        {
            Id = Guid.NewGuid(), Visibility = visibility, Status = status,
            StorageProvider = "AzureBlob", StorageContainer = "assets", StorageKey = "test"
        };
        db.Assets.Add(asset);
        await db.SaveChangesAsync();
        var provider = new Mock<IAssetStorageProvider>();
        provider.SetupGet(value => value.ProviderName).Returns("AzureBlob");
        provider.Setup(value => value.CreateReadInstructionsAsync(asset, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetReadInstructions("https://storage.example.com/test?signed", true, DateTimeOffset.UtcNow.AddMinutes(20)));
        var clock = new Mock<IDateTimeProvider>();
        clock.SetupGet(value => value.UtcNow).Returns(DateTimeOffset.UtcNow);
        var service = new AssetService(db, provider.Object, clock.Object, Mock.Of<IAuditLogService>(),
            Mock.Of<ICurrentUserService>(), Options.Create(new AssetStorageOptions()));
        if (allowed)
            Assert.Equal("https://storage.example.com/test?signed", await service.GetPublicStorageReadUrlAsync(asset.Id, default));
        else
        {
            var error = await Assert.ThrowsAsync<AppException>(() => service.GetPublicStorageReadUrlAsync(asset.Id, default));
            Assert.Equal(404, error.StatusCode);
            provider.Verify(value => value.CreateReadInstructionsAsync(It.IsAny<Asset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}
