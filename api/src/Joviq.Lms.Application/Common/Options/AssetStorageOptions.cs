namespace Joviq.Lms.Application.Common.Options;

public sealed class AssetStorageOptions
{
    public const string SectionName = "Assets";

    public string Provider { get; init; } = "Local";

    public int UploadUrlExpiryMinutes { get; init; } = 15;

    public int PrivateReadUrlExpiryMinutes { get; init; } = 20;

    public long MaxImageBytes { get; init; } = 10 * 1024 * 1024;

    public long MaxVideoBytes { get; init; } = 1024L * 1024L * 1024L;

    public long MaxDocumentBytes { get; init; } = 50 * 1024 * 1024;

    public string[] AllowedImageContentTypes { get; init; } =
    [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    public string[] AllowedVideoContentTypes { get; init; } =
    [
        "video/mp4",
        "video/webm",
        "video/quicktime"
    ];

    public string[] AllowedDocumentContentTypes { get; init; } =
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip"
    ];

    public LocalAssetStorageOptions Local { get; init; } = new();

    public AwsS3AssetStorageOptions AwsS3 { get; init; } = new();
}

public sealed class LocalAssetStorageOptions
{
    public string RootPath { get; init; } = "storage/assets";

    public string PublicBaseUrl { get; init; } = "https://localhost:7001";
}

public sealed class AwsS3AssetStorageOptions
{
    public string BucketName { get; init; } = string.Empty;

    public string Region { get; init; } = "ap-south-1";

    public string? ServiceUrl { get; init; }

    public bool ForcePathStyle { get; init; }

    public string? AccessKeyId { get; init; }

    public string? SecretAccessKey { get; init; }

    public string? PublicBaseUrl { get; init; }

    public string? CloudFrontKeyPairId { get; init; }

    public string? CloudFrontPrivateKeyPem { get; init; }
}
