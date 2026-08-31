using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Application.Assets;

public sealed record AssetResponse(
    Guid Id,
    Guid? OwnerUserId,
    Guid? ProgramId,
    Guid? LessonId,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    string Type,
    string Purpose,
    string Visibility,
    string Status,
    string StorageProvider,
    string StorageKey,
    string? PublicUrl,
    string? DeliveryUrl,
    string? Checksum,
    int? Width,
    int? Height,
    int? DurationSeconds,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UploadedAt);

public sealed record AssetUploadUrlResponse(
    Guid AssetId,
    string UploadUrl,
    string HttpMethod,
    IReadOnlyDictionary<string, string> Headers,
    DateTimeOffset ExpiresAt,
    AssetResponse Asset);

public sealed record AssetAccessResponse(
    Guid AssetId,
    string Url,
    string ContentType,
    string FileName,
    bool IsSigned,
    DateTimeOffset? ExpiresAt);

public sealed record AssetFileDownload(
    Stream Content,
    string ContentType,
    string FileName,
    DateTimeOffset? LastModified);

public sealed class CreateAssetUploadRequest
{
    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public long SizeBytes { get; init; }

    public AssetType Type { get; init; } = AssetType.Other;

    public AssetPurpose Purpose { get; init; } = AssetPurpose.General;

    public AssetVisibility Visibility { get; init; } = AssetVisibility.Private;

    public Guid? ProgramId { get; init; }

    public Guid? LessonId { get; init; }
}

public sealed class CompleteAssetUploadRequest
{
    public string? Checksum { get; init; }

    public int? Width { get; init; }

    public int? Height { get; init; }

    public int? DurationSeconds { get; init; }
}
