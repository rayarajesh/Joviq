using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class Asset : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid? OwnerUserId { get; set; }

    public Guid? ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public Guid? LessonId { get; set; }

    public Lesson? Lesson { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long SizeBytes { get; set; }

    public AssetType Type { get; set; } = AssetType.Other;

    public AssetPurpose Purpose { get; set; } = AssetPurpose.General;

    public AssetVisibility Visibility { get; set; } = AssetVisibility.Private;

    public AssetStatus Status { get; set; } = AssetStatus.PendingUpload;

    public string StorageProvider { get; set; } = string.Empty;

    public string StorageContainer { get; set; } = string.Empty;

    public string StorageKey { get; set; } = string.Empty;

    public string? PublicUrl { get; set; }

    public string? Checksum { get; set; }

    public int? Width { get; set; }

    public int? Height { get; set; }

    public int? DurationSeconds { get; set; }

    public DateTimeOffset? UploadedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public string? UploadTokenHash { get; set; }

    public DateTimeOffset? UploadTokenExpiresAt { get; set; }
}
