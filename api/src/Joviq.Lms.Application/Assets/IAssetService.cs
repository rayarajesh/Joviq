namespace Joviq.Lms.Application.Assets;

public interface IAssetService
{
    Task<AssetUploadUrlResponse> CreateUploadAsync(
        Guid userId,
        CreateAssetUploadRequest request,
        CancellationToken cancellationToken);

    Task<AssetResponse> CompleteUploadAsync(
        Guid userId,
        Guid assetId,
        CompleteAssetUploadRequest request,
        CancellationToken cancellationToken);

    Task<AssetResponse> GetAssetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken);

    Task<AssetAccessResponse> GetReadUrlAsync(Guid userId, Guid assetId, CancellationToken cancellationToken);

    Task UploadLocalAssetAsync(
        Guid assetId,
        string token,
        Stream content,
        long? contentLength,
        string? contentType,
        CancellationToken cancellationToken);

    Task<AssetFileDownload> OpenLocalAssetAsync(
        Guid assetId,
        string token,
        CancellationToken cancellationToken);
}
