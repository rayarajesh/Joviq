using Azure;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services.Assets;

internal sealed class AzureBlobAssetStorageProvider : IAssetStorageProvider
{
    private readonly BlobServiceClient _client;
    private readonly AzureBlobAssetStorageOptions _options;

    public AzureBlobAssetStorageProvider(IOptions<AssetStorageOptions> options)
    {
        _options = options.Value.AzureBlob;
        if (!Uri.TryCreate(_options.ServiceUri, UriKind.Absolute, out var serviceUri) ||
            serviceUri.Scheme != Uri.UriSchemeHttps || string.IsNullOrWhiteSpace(_options.ContainerName))
        {
            throw new InvalidOperationException("Azure Blob Storage requires an HTTPS ServiceUri and ContainerName.");
        }

        _client = new BlobServiceClient(serviceUri, new DefaultAzureCredential());
    }

    public string ProviderName => "AzureBlob";
    internal AzureBlobAssetStorageProvider(IOptions<AssetStorageOptions> options, BlobServiceClient client)
    {
        _options = options.Value.AzureBlob;
        _client = client;
    }

    public string ContainerName => _options.ContainerName;
    public string? GetPublicUrl(Asset asset) => null;

    public async Task<AssetUploadInstructions> CreateUploadInstructionsAsync(
        Asset asset, string rawUploadToken, DateTimeOffset expiresAt, CancellationToken cancellationToken)
    {
        var url = await CreateSasAsync(asset, expiresAt, BlobSasPermissions.Create, cancellationToken);
        return new AssetUploadInstructions(url, "PUT", new Dictionary<string, string>
        {
            ["Content-Type"] = asset.ContentType,
            ["x-ms-blob-type"] = "BlockBlob"
        }, expiresAt);
    }

    public async Task<AssetReadInstructions> CreateReadInstructionsAsync(
        Asset asset, DateTimeOffset expiresAt, CancellationToken cancellationToken)
    {
        return new AssetReadInstructions(
            await CreateSasAsync(asset, expiresAt, BlobSasPermissions.Read, cancellationToken), true, expiresAt);
    }

    public async Task<bool> ExistsAsync(Asset asset, CancellationToken cancellationToken)
    {
        try
        {
            var properties = (await GetBlob(asset).GetPropertiesAsync(cancellationToken: cancellationToken)).Value;
            if (properties.ContentLength != asset.SizeBytes ||
                !string.Equals(properties.ContentType, asset.ContentType, StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException("Uploaded file size or content type does not match the asset.", 400, "asset_upload_invalid");
            }

            return true;
        }
        catch (RequestFailedException exception) when (exception.Status == 404)
        {
            return false;
        }
    }

    public Task SaveLocalUploadAsync(Asset asset, Stream content, long maxBytes, CancellationToken cancellationToken) =>
        throw new AppException("Local uploads are disabled for Azure Blob Storage.", 400, "local_upload_not_enabled");

    public Task<AssetLocalFile> OpenLocalFileAsync(Asset asset, string? token, CancellationToken cancellationToken) =>
        throw new AppException("Local files are disabled for Azure Blob Storage.", 404, "local_assets_not_enabled");

    private BlobClient GetBlob(Asset asset)
    {
        if (asset.StorageProvider != ProviderName || asset.StorageContainer != ContainerName)
        {
            throw new AppException("This asset belongs to a different storage provider. Migrate it before accessing it here.", 409, "asset_storage_mismatch");
        }

        return _client.GetBlobContainerClient(ContainerName).GetBlobClient(asset.StorageKey);
    }

    private async Task<string> CreateSasAsync(
        Asset asset, DateTimeOffset expiresAt, BlobSasPermissions permissions, CancellationToken cancellationToken)
    {
        var blob = GetBlob(asset);
        var startsAt = DateTimeOffset.UtcNow.AddMinutes(-5);
        if (expiresAt <= DateTimeOffset.UtcNow || expiresAt > DateTimeOffset.UtcNow.AddHours(1))
        {
            throw new InvalidOperationException("Asset SAS expiration must be within one hour.");
        }

        var key = (await _client.GetUserDelegationKeyAsync(startsAt, expiresAt, cancellationToken)).Value;
        var builder = new BlobSasBuilder
        {
            BlobContainerName = ContainerName,
            BlobName = asset.StorageKey,
            Resource = "b",
            Protocol = SasProtocol.Https,
            StartsOn = startsAt,
            ExpiresOn = expiresAt
        };
        builder.SetPermissions(permissions);
        return new BlobUriBuilder(blob.Uri)
        {
            Sas = builder.ToSasQueryParameters(key, _client.AccountName)
        }.ToUri().AbsoluteUri;
    }
}
