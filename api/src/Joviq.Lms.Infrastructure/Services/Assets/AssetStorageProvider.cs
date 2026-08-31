using Joviq.Lms.Domain.Entities;

namespace Joviq.Lms.Infrastructure.Services.Assets;

internal sealed record AssetUploadInstructions(
    string Url,
    string HttpMethod,
    IReadOnlyDictionary<string, string> Headers,
    DateTimeOffset ExpiresAt);

internal sealed record AssetReadInstructions(
    string Url,
    bool IsSigned,
    DateTimeOffset? ExpiresAt);

internal sealed record AssetLocalFile(
    Stream Content,
    string ContentType,
    string FileName,
    DateTimeOffset? LastModified);

internal interface IAssetStorageProvider
{
    string ProviderName { get; }

    string ContainerName { get; }

    string? GetPublicUrl(Asset asset);

    AssetUploadInstructions CreateUploadInstructions(
        Asset asset,
        string rawUploadToken,
        DateTimeOffset expiresAt);

    Task<AssetReadInstructions> CreateReadInstructionsAsync(
        Asset asset,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken);

    Task<bool> ExistsAsync(Asset asset, CancellationToken cancellationToken);

    Task SaveLocalUploadAsync(
        Asset asset,
        Stream content,
        long maxBytes,
        CancellationToken cancellationToken);

    Task<AssetLocalFile> OpenLocalFileAsync(
        Asset asset,
        string token,
        CancellationToken cancellationToken);
}
