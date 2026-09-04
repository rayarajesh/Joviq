using System.Text.RegularExpressions;
using Joviq.Lms.Application.Assets;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services.Assets;

internal sealed class AssetService(
    ApplicationDbContext dbContext,
    IAssetStorageProvider storageProvider,
    IDateTimeProvider clock,
    IAuditLogService auditLog,
    ICurrentUserService currentUser,
    IOptions<AssetStorageOptions> options) : IAssetService
{
    private static readonly Regex SafeFileNameRegex = new("[^a-zA-Z0-9._-]+", RegexOptions.Compiled);
    private readonly AssetStorageOptions _options = options.Value;

    public async Task<AssetUploadUrlResponse> CreateUploadAsync(
        Guid userId,
        CreateAssetUploadRequest request,
        CancellationToken cancellationToken)
    {
        var normalized = await ValidateCreateRequestAsync(userId, request, cancellationToken);
        var assetId = Guid.NewGuid();
        var rawUploadToken = SecureTokenHasher.NewUrlSafeToken(32);
        var expiresAt = clock.UtcNow.AddMinutes(Math.Max(_options.UploadUrlExpiryMinutes, 1));

        var asset = new Asset
        {
            Id = assetId,
            OwnerUserId = userId,
            ProgramId = normalized.ProgramId,
            LessonId = normalized.LessonId,
            OriginalFileName = normalized.FileName,
            ContentType = normalized.ContentType,
            SizeBytes = normalized.SizeBytes,
            Type = normalized.Type,
            Purpose = normalized.Purpose,
            Visibility = normalized.Visibility,
            Status = AssetStatus.PendingUpload,
            StorageProvider = storageProvider.ProviderName,
            StorageContainer = storageProvider.ContainerName,
            StorageKey = BuildStorageKey(assetId, normalized),
            UploadTokenHash = SecureTokenHasher.Hash(rawUploadToken),
            UploadTokenExpiresAt = expiresAt
        };

        asset.PublicUrl = storageProvider.GetPublicUrl(asset);
        dbContext.Assets.Add(asset);
        Audit("UploadCreated", new
        {
            asset.Id,
            asset.Purpose,
            asset.Type,
            asset.Visibility,
            asset.StorageProvider,
            asset.StorageKey
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        var upload = storageProvider.CreateUploadInstructions(asset, rawUploadToken, expiresAt);
        return new AssetUploadUrlResponse(
            asset.Id,
            upload.Url,
            upload.HttpMethod,
            upload.Headers,
            upload.ExpiresAt,
            MapAsset(asset));
    }

    public async Task<AssetResponse> CompleteUploadAsync(
        Guid userId,
        Guid assetId,
        CompleteAssetUploadRequest request,
        CancellationToken cancellationToken)
    {
        var asset = await GetAssetEntityAsync(assetId, cancellationToken);
        EnsureCanManage(userId, asset);

        if (asset.Status == AssetStatus.Deleted)
        {
            throw new AppException("Asset was deleted.", 404, "asset_not_found");
        }

        if (!await storageProvider.ExistsAsync(asset, cancellationToken))
        {
            throw new AppException("Asset file has not been uploaded yet.", 400, "asset_upload_missing");
        }

        asset.Status = AssetStatus.Ready;
        asset.UploadedAt ??= clock.UtcNow;
        asset.UploadTokenHash = null;
        asset.UploadTokenExpiresAt = null;
        asset.Checksum = OptionalText(request.Checksum, 160);
        asset.Width = PositiveOrNull(request.Width, nameof(request.Width));
        asset.Height = PositiveOrNull(request.Height, nameof(request.Height));
        asset.DurationSeconds = PositiveOrNull(request.DurationSeconds, nameof(request.DurationSeconds));
        asset.PublicUrl = storageProvider.GetPublicUrl(asset);

        Audit("UploadCompleted", new { asset.Id, asset.Status, asset.StorageProvider, asset.StorageKey });
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapAsset(asset);
    }

    public async Task<AssetResponse> GetAssetAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken)
    {
        var asset = await GetAssetEntityAsync(assetId, cancellationToken);
        await EnsureCanReadAsync(userId, asset, cancellationToken);
        return MapAsset(asset);
    }

    public async Task<AssetAccessResponse> GetReadUrlAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken)
    {
        var asset = await GetAssetEntityAsync(assetId, cancellationToken);
        await EnsureCanReadAsync(userId, asset, cancellationToken);

        if (asset.Status != AssetStatus.Ready)
        {
            throw new AppException("Asset is not ready.", 409, "asset_not_ready");
        }

        var expiresAt = asset.Visibility == AssetVisibility.Public
            ? (DateTimeOffset?)null
            : clock.UtcNow.AddMinutes(Math.Max(_options.PrivateReadUrlExpiryMinutes, 1));
        var readUrl = await storageProvider.CreateReadInstructionsAsync(
            asset,
            expiresAt ?? clock.UtcNow.AddMinutes(Math.Max(_options.PrivateReadUrlExpiryMinutes, 1)),
            cancellationToken);

        return new AssetAccessResponse(
            asset.Id,
            readUrl.Url,
            asset.ContentType,
            asset.OriginalFileName,
            readUrl.IsSigned,
            readUrl.ExpiresAt);
    }

    public async Task UploadLocalAssetAsync(
        Guid assetId,
        string token,
        Stream content,
        long? contentLength,
        string? contentType,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new AppException("Upload token is required.", 401, "upload_token_required");
        }

        var asset = await GetAssetEntityAsync(assetId, cancellationToken);
        if (asset.StorageProvider != storageProvider.ProviderName || storageProvider.ProviderName != "Local")
        {
            throw new AppException("Local upload is not available for this asset.", 400, "local_upload_not_available");
        }

        if (asset.Status != AssetStatus.PendingUpload)
        {
            throw new AppException("Asset upload is not pending.", 409, "asset_not_pending");
        }

        if (asset.UploadTokenExpiresAt <= clock.UtcNow ||
            !string.Equals(asset.UploadTokenHash, SecureTokenHasher.Hash(token), StringComparison.Ordinal))
        {
            throw new AppException("Upload token is invalid or expired.", 403, "invalid_upload_token");
        }

        var normalizedContentType = NormalizeContentType(contentType ?? asset.ContentType);
        if (!string.Equals(normalizedContentType, asset.ContentType, StringComparison.OrdinalIgnoreCase))
        {
            throw Validation(nameof(contentType), "Content-Type must match the requested upload.");
        }

        var maxBytes = MaxBytesFor(asset.Type);
        if (contentLength.HasValue && contentLength.Value > maxBytes)
        {
            throw new AppException("Asset is larger than the allowed limit.", 400, "asset_too_large");
        }

        await storageProvider.SaveLocalUploadAsync(asset, content, maxBytes, cancellationToken);
    }

    public async Task<AssetFileDownload> OpenLocalAssetAsync(
        Guid assetId,
        string token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new AppException("Asset link token is required.", 401, "asset_link_token_required");
        }

        var asset = await GetAssetEntityAsync(assetId, cancellationToken);
        if (asset.StorageProvider != storageProvider.ProviderName || storageProvider.ProviderName != "Local")
        {
            throw new AppException("Local asset files are not enabled.", 404, "local_assets_not_enabled");
        }

        if (asset.Status != AssetStatus.Ready)
        {
            throw new AppException("Asset is not ready.", 409, "asset_not_ready");
        }

        var file = await storageProvider.OpenLocalFileAsync(asset, token, cancellationToken);
        return new AssetFileDownload(file.Content, file.ContentType, file.FileName, file.LastModified);
    }

    public async Task<AssetFileDownload> OpenPublicLocalAssetAsync(
        Guid assetId,
        CancellationToken cancellationToken)
    {
        var asset = await GetAssetEntityAsync(assetId, cancellationToken);
        if (asset.StorageProvider != storageProvider.ProviderName || storageProvider.ProviderName != "Local")
        {
            throw new AppException("Local asset files are not enabled.", 404, "local_assets_not_enabled");
        }

        if (asset.Status != AssetStatus.Ready || asset.Visibility != AssetVisibility.Public)
        {
            throw new AppException("Asset file was not found.", 404, "asset_file_not_found");
        }

        var file = await storageProvider.OpenLocalFileAsync(asset, null, cancellationToken);
        return new AssetFileDownload(file.Content, file.ContentType, file.FileName, file.LastModified);
    }

    private async Task<NormalizedAssetUpload> ValidateCreateRequestAsync(
        Guid userId,
        CreateAssetUploadRequest request,
        CancellationToken cancellationToken)
    {
        var fileName = SanitizeFileName(RequiredText(request.FileName, nameof(request.FileName), 1, 260));
        var contentType = NormalizeContentType(RequiredText(request.ContentType, nameof(request.ContentType), 3, 120));
        if (request.SizeBytes <= 0)
        {
            throw Validation(nameof(request.SizeBytes), "File size must be greater than zero.");
        }

        EnsurePurposeMatchesType(request.Purpose, request.Type);
        EnsureAllowedContentType(request.Type, contentType);
        EnsureSizeAllowed(request.Type, request.SizeBytes);
        EnsureUploadPermission(userId, request);

        Guid? programId = request.ProgramId;
        Guid? lessonId = request.LessonId;

        if (request.Purpose == AssetPurpose.ProgramThumbnail && programId is null)
        {
            throw Validation(nameof(request.ProgramId), "Program thumbnail uploads require a programId.");
        }

        if (request.Purpose == AssetPurpose.LessonVideo && lessonId is null)
        {
            throw Validation(nameof(request.LessonId), "Lesson video uploads require a lessonId.");
        }

        if (programId.HasValue &&
            !await dbContext.LearningPrograms.AnyAsync(x => x.Id == programId.Value, cancellationToken))
        {
            throw new AppException("Program was not found.", 404, "program_not_found");
        }

        if (lessonId.HasValue)
        {
            var lesson = await dbContext.Lessons
                .AsNoTracking()
                .Include(x => x.Module)
                .FirstOrDefaultAsync(x => x.Id == lessonId.Value, cancellationToken)
                ?? throw new AppException("Lesson was not found.", 404, "lesson_not_found");

            if (programId.HasValue && lesson.Module?.ProgramId != programId.Value)
            {
                throw Validation(nameof(request.ProgramId), "ProgramId must match the lesson's program.");
            }

            programId ??= lesson.Module?.ProgramId;
        }

        return new NormalizedAssetUpload(
            fileName,
            contentType,
            request.SizeBytes,
            request.Type,
            request.Purpose,
            request.Visibility,
            programId,
            lessonId);
    }

    private async Task<Asset> GetAssetEntityAsync(Guid assetId, CancellationToken cancellationToken)
    {
        return await dbContext.Assets
            .FirstOrDefaultAsync(x => x.Id == assetId && x.Status != AssetStatus.Deleted, cancellationToken)
            ?? throw new AppException("Asset was not found.", 404, "asset_not_found");
    }

    private void EnsureCanManage(Guid userId, Asset asset)
    {
        if (IsAdmin() || asset.OwnerUserId == userId)
        {
            return;
        }

        throw new AppException("You do not have access to manage this asset.", 403, "asset_manage_forbidden");
    }

    private async Task EnsureCanReadAsync(Guid userId, Asset asset, CancellationToken cancellationToken)
    {
        if (asset.Visibility == AssetVisibility.Public || IsAdmin() || asset.OwnerUserId == userId)
        {
            return;
        }

        if (IsStudent() && asset.LessonId.HasValue)
        {
            if (await CanStudentReadLessonAssetAsync(userId, asset.LessonId.Value, cancellationToken))
            {
                return;
            }
        }

        throw new AppException("You do not have access to this asset.", 403, "asset_read_forbidden");
    }

    private async Task<bool> CanStudentReadLessonAssetAsync(
        Guid studentId,
        Guid lessonId,
        CancellationToken cancellationToken)
    {
        var lesson = await dbContext.Lessons
            .AsNoTracking()
            .Include(x => x.Module)
            .FirstOrDefaultAsync(x => x.Id == lessonId, cancellationToken);

        if (lesson?.Module is null)
        {
            return false;
        }

        var enrollment = await dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.StudentId == studentId &&
                        x.ProgramId == lesson.Module.ProgramId &&
                        x.Status != EnrollmentStatus.Cancelled)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (enrollment is null)
        {
            return false;
        }

        return enrollment.Status != EnrollmentStatus.Reserved ||
            lesson.AccessLevel != ContentAccessLevel.Full;
    }

    private void EnsureUploadPermission(Guid userId, CreateAssetUploadRequest request)
    {
        _ = userId;
        var privileged = IsAdmin();

        if (request.Visibility == AssetVisibility.Public && !privileged)
        {
            throw new AppException("Only admins can upload public assets.", 403, "public_asset_forbidden");
        }

        if (request.Purpose is AssetPurpose.ProgramThumbnail or AssetPurpose.LessonVideo or AssetPurpose.LessonResource &&
            !privileged)
        {
            throw new AppException("Only admins can upload LMS content assets.", 403, "lms_asset_forbidden");
        }
    }

    private bool IsAdmin()
    {
        return currentUser.Roles.Any(role => role.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase));
    }

    private bool IsStudent()
    {
        return currentUser.Roles.Any(role => role.Equals(RoleNames.Student, StringComparison.OrdinalIgnoreCase));
    }

    private void Audit(string eventType, object? metadata = null)
        => auditLog.Add($"Assets.{eventType}", metadata);

    private static void EnsurePurposeMatchesType(AssetPurpose purpose, AssetType type)
    {
        if (purpose == AssetPurpose.ProgramThumbnail && type != AssetType.Image)
        {
            throw Validation(nameof(type), "Program thumbnails must be image assets.");
        }

        if (purpose == AssetPurpose.LessonVideo && type != AssetType.Video)
        {
            throw Validation(nameof(type), "Lesson videos must be video assets.");
        }
    }

    private void EnsureAllowedContentType(AssetType type, string contentType)
    {
        var allowed = type switch
        {
            AssetType.Image => _options.AllowedImageContentTypes,
            AssetType.Video => _options.AllowedVideoContentTypes,
            AssetType.Document => _options.AllowedDocumentContentTypes,
            _ => []
        };

        if (allowed.Length > 0 &&
            !allowed.Any(value => value.Equals(contentType, StringComparison.OrdinalIgnoreCase)))
        {
            throw Validation(nameof(contentType), $"Content-Type '{contentType}' is not allowed for {type} assets.");
        }
    }

    private void EnsureSizeAllowed(AssetType type, long sizeBytes)
    {
        var maxBytes = MaxBytesFor(type);
        if (sizeBytes > maxBytes)
        {
            throw new AppException("Asset is larger than the allowed limit.", 400, "asset_too_large");
        }
    }

    private long MaxBytesFor(AssetType type)
    {
        return type switch
        {
            AssetType.Image => Math.Max(_options.MaxImageBytes, 1),
            AssetType.Video => Math.Max(_options.MaxVideoBytes, 1),
            AssetType.Document => Math.Max(_options.MaxDocumentBytes, 1),
            _ => Math.Max(_options.MaxDocumentBytes, 1)
        };
    }

    private static string BuildStorageKey(Guid assetId, NormalizedAssetUpload upload)
    {
        var now = DateTimeOffset.UtcNow;
        var scope = upload.Visibility == AssetVisibility.Public ? "public" : "private";
        var purpose = ToKebabCase(upload.Purpose.ToString());
        var extension = GetSafeExtension(upload.FileName, upload.ContentType);

        return $"assets/{scope}/{purpose}/{now:yyyy}/{now:MM}/{assetId:N}{extension}";
    }

    private static string GetSafeExtension(string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (extension is ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif" or ".mp4" or ".webm" or ".mov" or ".pdf" or ".doc" or ".docx" or ".ppt" or ".pptx" or ".zip")
        {
            return extension;
        }

        return contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            "video/mp4" => ".mp4",
            "video/webm" => ".webm",
            "video/quicktime" => ".mov",
            "application/pdf" => ".pdf",
            "application/msword" => ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
            "application/vnd.ms-powerpoint" => ".ppt",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" => ".pptx",
            "application/zip" => ".zip",
            _ => ".bin"
        };
    }

    private static AssetResponse MapAsset(Asset asset)
    {
        var deliveryUrl = asset.Status == AssetStatus.Ready && asset.Visibility == AssetVisibility.Public
            ? asset.PublicUrl
            : null;

        return new AssetResponse(
            asset.Id,
            asset.OwnerUserId,
            asset.ProgramId,
            asset.LessonId,
            asset.OriginalFileName,
            asset.ContentType,
            asset.SizeBytes,
            asset.Type.ToString(),
            asset.Purpose.ToString(),
            asset.Visibility.ToString(),
            asset.Status.ToString(),
            asset.StorageProvider,
            asset.StorageKey,
            asset.PublicUrl,
            deliveryUrl,
            asset.Checksum,
            asset.Width,
            asset.Height,
            asset.DurationSeconds,
            asset.CreatedAt,
            asset.UploadedAt);
    }

    private static string SanitizeFileName(string fileName)
    {
        var nameOnly = Path.GetFileName(fileName.Trim());
        var sanitized = SafeFileNameRegex.Replace(nameOnly, "-").Trim('-', '.', '_');
        return string.IsNullOrWhiteSpace(sanitized) ? "asset.bin" : sanitized;
    }

    private static string NormalizeContentType(string contentType)
    {
        return contentType.Split(';', StringSplitOptions.RemoveEmptyEntries)[0].Trim().ToLowerInvariant();
    }

    private static string RequiredText(string value, string fieldName, int minLength, int maxLength)
    {
        var trimmed = value.Trim();
        if (trimmed.Length < minLength || trimmed.Length > maxLength)
        {
            throw Validation(fieldName, $"{fieldName} must be {minLength} to {maxLength} characters.");
        }

        return trimmed;
    }

    private static string? OptionalText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
        {
            throw Validation(nameof(value), $"Value must be {maxLength} characters or fewer.");
        }

        return trimmed;
    }

    private static int? PositiveOrNull(int? value, string fieldName)
    {
        if (value is null)
        {
            return null;
        }

        if (value <= 0)
        {
            throw Validation(fieldName, $"{fieldName} must be greater than zero.");
        }

        return value;
    }

    private static string ToKebabCase(string value)
    {
        return Regex.Replace(value, "([a-z0-9])([A-Z])", "$1-$2").ToLowerInvariant();
    }

    private static ValidationAppException Validation(string fieldName, string message)
    {
        return new ValidationAppException(new Dictionary<string, string[]>
        {
            [fieldName] = [message]
        });
    }

    private sealed record NormalizedAssetUpload(
        string FileName,
        string ContentType,
        long SizeBytes,
        AssetType Type,
        AssetPurpose Purpose,
        AssetVisibility Visibility,
        Guid? ProgramId,
        Guid? LessonId);
}
