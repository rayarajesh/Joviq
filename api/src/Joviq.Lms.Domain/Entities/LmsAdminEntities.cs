using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class AdminContentItem : AuditableEntity
{
    public Guid Id { get; set; }

    public AdminContentType ContentType { get; set; } = AdminContentType.WebsiteContent;

    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Summary { get; set; }

    public string? Body { get; set; }

    public string? ImageUrl { get; set; }

    public string? ExternalUrl { get; set; }

    public string MetadataJson { get; set; } = "{}";

    public AdminContentStatus Status { get; set; } = AdminContentStatus.Draft;

    public bool IsFeatured { get; set; }

    public int SortOrder { get; set; }
}

public sealed class AdminSetting : AuditableEntity
{
    public Guid Id { get; set; }

    public string Category { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsSecret { get; set; }
}
