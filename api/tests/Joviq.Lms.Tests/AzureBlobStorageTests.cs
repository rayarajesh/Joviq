using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Services.Assets;
using Microsoft.Extensions.Options;
using Moq;

namespace Joviq.Lms.Tests;

public class AzureBlobStorageTests
{
    private static readonly Asset Asset = new()
    {
        StorageProvider = "AzureBlob", StorageContainer = "assets", StorageKey = "private/test.png",
        ContentType = "image/png", SizeBytes = 42
    };

    private static AzureBlobAssetStorageProvider Provider(long size = 42, string contentType = "image/png")
    {
        var blob = new Mock<BlobClient>(new Uri("https://joviq.blob.core.windows.net/assets/private/test.png"), new BlobClientOptions());
        blob.SetupGet(client => client.Uri).Returns(new Uri("https://joviq.blob.core.windows.net/assets/private/test.png"));
        blob.Setup(client => client.GetPropertiesAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Response.FromValue(BlobsModelFactory.BlobProperties(contentLength: size, contentType: contentType), Mock.Of<Response>()));
        var container = new Mock<BlobContainerClient>();
        container.Setup(client => client.GetBlobClient(Asset.StorageKey)).Returns(blob.Object);
        var service = new Mock<BlobServiceClient>(new Uri("https://joviq.blob.core.windows.net"), new BlobClientOptions());
        service.SetupGet(client => client.AccountName).Returns("joviq");
        service.Setup(client => client.GetBlobContainerClient("assets")).Returns(container.Object);
        service.Setup(client => client.GetUserDelegationKeyAsync(It.IsAny<DateTimeOffset?>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Response.FromValue(BlobsModelFactory.UserDelegationKey(
                Guid.NewGuid().ToString(), Guid.NewGuid().ToString(),
                DateTimeOffset.UtcNow.AddMinutes(-5), DateTimeOffset.UtcNow.AddHours(1),
                "b", "2023-11-03", Convert.ToBase64String(new byte[32])), Mock.Of<Response>()));
        return new AzureBlobAssetStorageProvider(Options.Create(new AssetStorageOptions
        {
            AzureBlob = new AzureBlobAssetStorageOptions { ServiceUri = "https://joviq.blob.core.windows.net", ContainerName = "assets", PublicBaseUrl = "https://api.example.com" }
        }), service.Object);
    }

    [Fact]
    public async Task UploadSasCanCreateOnlyOneBlobAndCannotOverwrite()
    {
        var instructions = await Provider().CreateUploadInstructionsAsync(Asset, "unused", DateTimeOffset.UtcNow.AddMinutes(15), default);
        var url = new Uri(instructions.Url);
        Assert.Equal("/assets/private/test.png", url.AbsolutePath);
        Assert.Contains("sp=c&", url.Query);
        Assert.Contains("spr=https", url.Query);
        Assert.Equal("BlockBlob", instructions.Headers["x-ms-blob-type"]);
        Assert.Equal("PUT", instructions.HttpMethod);
    }

    [Fact]
    public async Task ReadSasIsReadOnlyAndPublicUrlIsNotExposed()
    {
        var provider = Provider();
        var instructions = await provider.CreateReadInstructionsAsync(Asset, DateTimeOffset.UtcNow.AddMinutes(20), default);
        Assert.Contains("sp=r&", new Uri(instructions.Url).Query);
        Assert.True(instructions.IsSigned);
        Assert.Null(provider.GetPublicUrl(Asset));
    }

    [Theory]
    [InlineData(43, "image/png")]
    [InlineData(42, "text/html")]
    public async Task CompletionRejectsMismatchedUploadedMetadata(long size, string contentType) =>
        await Assert.ThrowsAsync<AppException>(() => Provider(size, contentType).ExistsAsync(Asset, default));

    [Fact]
    public void PublicAssetsUsePermanentApiUrlsWithoutSasCredentials()
    {
        var asset = new Asset { Id = Guid.NewGuid(), Visibility = Joviq.Lms.Domain.Enums.AssetVisibility.Public };
        Assert.Equal($"https://api.example.com/api/v1/assets/public-files/{asset.Id:D}", Provider().GetPublicUrl(asset));
    }

    [Fact]
    public async Task RefusesAssetsFromAnotherProvider() =>
        await Assert.ThrowsAsync<AppException>(() => Provider().CreateReadInstructionsAsync(
            new Asset { StorageProvider = "AwsS3", StorageContainer = "assets" }, DateTimeOffset.UtcNow.AddMinutes(20), default));
}
