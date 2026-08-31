using System.Text.Json;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Domain.Entities;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services.Assets;

internal sealed class LocalAssetStorageProvider : IAssetStorageProvider
{
    private readonly LocalAssetStorageOptions _options;
    private readonly IDataProtector _readTokenProtector;
    private readonly string _rootPath;

    public LocalAssetStorageProvider(
        IOptions<AssetStorageOptions> options,
        IHostEnvironment environment,
        IDataProtectionProvider dataProtectionProvider)
    {
        _options = options.Value.Local;
        _readTokenProtector = dataProtectionProvider.CreateProtector("Joviq.Lms.Assets.LocalReadUrl.v1");

        var configuredRoot = string.IsNullOrWhiteSpace(_options.RootPath)
            ? "storage/assets"
            : _options.RootPath.Trim();
        _rootPath = Path.GetFullPath(Path.IsPathRooted(configuredRoot)
            ? configuredRoot
            : Path.Combine(environment.ContentRootPath, configuredRoot));

        Directory.CreateDirectory(_rootPath);
    }

    public string ProviderName => "Local";

    public string ContainerName => "local";

    public string? GetPublicUrl(Asset asset) => null;

    public AssetUploadInstructions CreateUploadInstructions(
        Asset asset,
        string rawUploadToken,
        DateTimeOffset expiresAt)
    {
        var url = $"{BaseUrl}/api/v1/assets/local-upload/{asset.Id:D}?token={Uri.EscapeDataString(rawUploadToken)}";
        return new AssetUploadInstructions(
            url,
            "PUT",
            new Dictionary<string, string> { ["Content-Type"] = asset.ContentType },
            expiresAt);
    }

    public Task<AssetReadInstructions> CreateReadInstructionsAsync(
        Asset asset,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Serialize(new LocalAssetReadToken(
            asset.Id,
            asset.StorageKey,
            expiresAt.UtcDateTime));
        var token = _readTokenProtector.Protect(payload);
        var url = $"{BaseUrl}/api/v1/assets/local-files/{asset.Id:D}?token={Uri.EscapeDataString(token)}";

        return Task.FromResult(new AssetReadInstructions(url, true, expiresAt));
    }

    public Task<bool> ExistsAsync(Asset asset, CancellationToken cancellationToken)
    {
        return Task.FromResult(File.Exists(GetSafePath(asset.StorageKey)));
    }

    public async Task SaveLocalUploadAsync(
        Asset asset,
        Stream content,
        long maxBytes,
        CancellationToken cancellationToken)
    {
        var targetPath = GetSafePath(asset.StorageKey);
        var directory = Path.GetDirectoryName(targetPath)
            ?? throw new AppException("Asset path is invalid.", 400, "invalid_asset_path");
        Directory.CreateDirectory(directory);

        var tempPath = $"{targetPath}.{Guid.NewGuid():N}.tmp";
        try
        {
            await using var output = new FileStream(
                tempPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true);

            var buffer = new byte[81920];
            long totalBytes = 0;
            int bytesRead;
            while ((bytesRead = await content.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
            {
                totalBytes += bytesRead;
                if (totalBytes > maxBytes)
                {
                    throw new AppException("Asset is larger than the allowed limit.", 400, "asset_too_large");
                }

                await output.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
            }
        }
        catch
        {
            if (File.Exists(tempPath))
            {
                File.Delete(tempPath);
            }

            throw;
        }

        File.Move(tempPath, targetPath, overwrite: true);
    }

    public Task<AssetLocalFile> OpenLocalFileAsync(
        Asset asset,
        string token,
        CancellationToken cancellationToken)
    {
        var readToken = ValidateReadToken(asset, token);
        if (readToken.ExpiresAtUtc <= DateTime.UtcNow)
        {
            throw new AppException("Asset link has expired.", 403, "asset_link_expired");
        }

        var path = GetSafePath(asset.StorageKey);
        if (!File.Exists(path))
        {
            throw new AppException("Asset file was not found.", 404, "asset_file_not_found");
        }

        var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
        return Task.FromResult(new AssetLocalFile(
            stream,
            asset.ContentType,
            asset.OriginalFileName,
            new DateTimeOffset(File.GetLastWriteTimeUtc(path))));
    }

    private string BaseUrl => string.IsNullOrWhiteSpace(_options.PublicBaseUrl)
        ? "https://localhost:7001"
        : _options.PublicBaseUrl.Trim().TrimEnd('/');

    private string GetSafePath(string storageKey)
    {
        var relativePath = storageKey.Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));
        var normalizedRoot = _rootPath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new AppException("Asset path is invalid.", 400, "invalid_asset_path");
        }

        return fullPath;
    }

    private LocalAssetReadToken ValidateReadToken(Asset asset, string token)
    {
        try
        {
            var payload = _readTokenProtector.Unprotect(token);
            var readToken = JsonSerializer.Deserialize<LocalAssetReadToken>(payload)
                ?? throw new JsonException("Read token was empty.");

            if (readToken.AssetId != asset.Id ||
                !string.Equals(readToken.StorageKey, asset.StorageKey, StringComparison.Ordinal))
            {
                throw new AppException("Asset link is invalid.", 403, "invalid_asset_link");
            }

            return readToken;
        }
        catch (AppException)
        {
            throw;
        }
        catch
        {
            throw new AppException("Asset link is invalid.", 403, "invalid_asset_link");
        }
    }

    private sealed record LocalAssetReadToken(Guid AssetId, string StorageKey, DateTime ExpiresAtUtc);
}
