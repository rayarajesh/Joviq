using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class LearningProgramCategory : AuditableEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsPublished { get; set; } = true;

    public ICollection<LearningProgram> Programs { get; set; } = [];
}

public sealed class LearningProgram : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    public LearningProgramCategory? Category { get; set; }

    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string ShortDescription { get; set; } = string.Empty;

    public string Overview { get; set; } = string.Empty;

    public string Level { get; set; } = string.Empty;

    public string Duration { get; set; } = string.Empty;

    public string LearningMode { get; set; } = string.Empty;

    public string MentorSummary { get; set; } = string.Empty;

    public string CertificationName { get; set; } = string.Empty;

    public string? ThumbnailUrl { get; set; }

    public string SkillsJson { get; set; } = "[]";

    public string OutcomesJson { get; set; } = "[]";

    public string FaqsJson { get; set; } = "[]";

    public ProgramStatus Status { get; set; } = ProgramStatus.Draft;

    public int SortOrder { get; set; }

    public ICollection<ProgramPlan> Plans { get; set; } = [];

    public ICollection<CurriculumModule> Modules { get; set; } = [];
}

public sealed class ProgramPlan : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public decimal ActualPrice { get; set; }

    public decimal OfferPrice { get; set; }

    public decimal ReserveAmount { get; set; }

    public string FeaturesJson { get; set; } = "[]";

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}

public sealed class CurriculumModule : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public ICollection<Lesson> Lessons { get; set; } = [];
}

public sealed class Lesson : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ModuleId { get; set; }

    public CurriculumModule? Module { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string? VideoUrl { get; set; }

    public string? NotesUrl { get; set; }

    public int DurationMinutes { get; set; }

    public ContentAccessLevel AccessLevel { get; set; } = ContentAccessLevel.Full;

    public int SortOrder { get; set; }

    public ICollection<LessonResource> Resources { get; set; } = [];
}

public sealed class LessonResource : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid LessonId { get; set; }

    public Lesson? Lesson { get; set; }

    public string Title { get; set; } = string.Empty;

    public string ResourceType { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;
}

public sealed class LessonProgress : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid LessonId { get; set; }

    public Lesson? Lesson { get; set; }

    public bool IsCompleted { get; set; }

    public int ProgressPercentage { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }
}
