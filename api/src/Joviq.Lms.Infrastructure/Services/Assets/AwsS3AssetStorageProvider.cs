using System.Net;
using System.Security.Cryptography;
using System.Text;
using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services.Assets;

internal sealed class AwsS3AssetStorageProvider : IAssetStorageProvider
{
    private readonly AwsS3AssetStorageOptions _options;
    private readonly IAmazonS3 _s3Client;

    public AwsS3AssetStorageProvider(IOptions<AssetStorageOptions> options)
    {
        _options = options.Value.AwsS3;

        var config = new AmazonS3Config
        {
            ForcePathStyle = _options.ForcePathStyle
        };

        if (!string.IsNullOrWhiteSpace(_options.ServiceUrl))
        {
            config.ServiceURL = _options.ServiceUrl.Trim();
        }
        else
        {
            config.RegionEndpoint = RegionEndpoint.GetBySystemName(NormalizedRegion);
        }

        _s3Client = HasStaticCredentials
            ? new AmazonS3Client(
                new BasicAWSCredentials(_options.AccessKeyId!.Trim(), _options.SecretAccessKey!.Trim()),
                config)
            : new AmazonS3Client(config);
    }

    public string ProviderName => "AwsS3";

    public string ContainerName => BucketName;

    public string? GetPublicUrl(Asset asset)
    {
        if (asset.Visibility != AssetVisibility.Public)
        {
            return null;
        }

        return BuildCdnUrl(asset.StorageKey);
    }

    public AssetUploadInstructions CreateUploadInstructions(
        Asset asset,
        string rawUploadToken,
        DateTimeOffset expiresAt)
    {
        EnsureConfigured();

        var request = new GetPreSignedUrlRequest
        {
            BucketName = BucketName,
            Key = asset.StorageKey,
            Verb = HttpVerb.PUT,
            Expires = expiresAt.UtcDateTime,
            ContentType = asset.ContentType
        };

        return new AssetUploadInstructions(
            _s3Client.GetPreSignedURL(request),
            "PUT",
            new Dictionary<string, string> { ["Content-Type"] = asset.ContentType },
            expiresAt);
    }

    public Task<AssetReadInstructions> CreateReadInstructionsAsync(
        Asset asset,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();

        if (asset.Visibility == AssetVisibility.Public)
        {
            var publicUrl = BuildCdnUrl(asset.StorageKey);
            if (!string.IsNullOrWhiteSpace(publicUrl))
            {
                return Task.FromResult(new AssetReadInstructions(publicUrl, false, null));
            }
        }

        if (CanSignCloudFrontUrls)
        {
            var publicUrl = BuildCdnUrl(asset.StorageKey)
                ?? throw new AppException("CloudFront asset URL is not configured.", 500, "asset_cdn_not_configured");
            return Task.FromResult(new AssetReadInstructions(
                SignCloudFrontUrl(publicUrl, expiresAt),
                true,
                expiresAt));
        }

        var request = new GetPreSignedUrlRequest
        {
            BucketName = BucketName,
            Key = asset.StorageKey,
            Verb = HttpVerb.GET,
            Expires = expiresAt.UtcDateTime
        };

        return Task.FromResult(new AssetReadInstructions(
            _s3Client.GetPreSignedURL(request),
            true,
            expiresAt));
    }

    public async Task<bool> ExistsAsync(Asset asset, CancellationToken cancellationToken)
    {
        EnsureConfigured();

        try
        {
            await _s3Client.GetObjectMetadataAsync(new GetObjectMetadataRequest
            {
                BucketName = BucketName,
                Key = asset.StorageKey
            }, cancellationToken);

            return true;
        }
        catch (AmazonS3Exception exception) when (
            exception.StatusCode == HttpStatusCode.NotFound ||
            exception.ErrorCode is "NoSuchKey" or "NotFound")
        {
            return false;
        }
    }

    public Task SaveLocalUploadAsync(
        Asset asset,
        Stream content,
        long maxBytes,
        CancellationToken cancellationToken)
    {
        throw new AppException("Local asset uploads are not enabled for AWS S3 storage.", 400, "local_upload_not_enabled");
    }

    public Task<AssetLocalFile> OpenLocalFileAsync(
        Asset asset,
        string token,
        CancellationToken cancellationToken)
    {
        throw new AppException("Local asset files are not enabled for AWS S3 storage.", 404, "local_assets_not_enabled");
    }

    private bool HasStaticCredentials =>
        !string.IsNullOrWhiteSpace(_options.AccessKeyId) &&
        !string.IsNullOrWhiteSpace(_options.SecretAccessKey);

    private bool CanSignCloudFrontUrls =>
        !string.IsNullOrWhiteSpace(_options.PublicBaseUrl) &&
        !string.IsNullOrWhiteSpace(_options.CloudFrontKeyPairId) &&
        !string.IsNullOrWhiteSpace(_options.CloudFrontPrivateKeyPem);

    private string BucketName => string.IsNullOrWhiteSpace(_options.BucketName)
        ? string.Empty
        : _options.BucketName.Trim();

    private string NormalizedRegion => string.IsNullOrWhiteSpace(_options.Region)
        ? "ap-south-1"
        : _options.Region.Trim();

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(BucketName))
        {
            throw new AppException("AWS S3 assets bucket is not configured.", 500, "asset_storage_not_configured");
        }
    }

    private string? BuildCdnUrl(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
        {
            return null;
        }

        var encodedKey = string.Join(
            '/',
            storageKey.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));

        return $"{_options.PublicBaseUrl.Trim().TrimEnd('/')}/{encodedKey}";
    }

    private string SignCloudFrontUrl(string resourceUrl, DateTimeOffset expiresAt)
    {
        var expires = expiresAt.ToUnixTimeSeconds();
        var policy = "{\"Statement\":[{\"Resource\":\"" + resourceUrl + "\",\"Condition\":{\"DateLessThan\":{\"AWS:EpochTime\":" + expires + "}}}]}";

        using var rsa = RSA.Create();
        rsa.ImportFromPem(NormalizedPrivateKeyPem);
        var signature = rsa.SignData(
            Encoding.UTF8.GetBytes(policy),
            HashAlgorithmName.SHA1,
            RSASignaturePadding.Pkcs1);

        var separator = resourceUrl.Contains('?') ? '&' : '?';
        return $"{resourceUrl}{separator}Expires={expires}&Signature={ToCloudFrontBase64(signature)}&Key-Pair-Id={Uri.EscapeDataString(_options.CloudFrontKeyPairId!.Trim())}";
    }

    private string NormalizedPrivateKeyPem =>
        _options.CloudFrontPrivateKeyPem!.Replace("\\n", "\n", StringComparison.Ordinal).Trim();

    private static string ToCloudFrontBase64(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('=', '_')
            .Replace('/', '~');
    }
}
