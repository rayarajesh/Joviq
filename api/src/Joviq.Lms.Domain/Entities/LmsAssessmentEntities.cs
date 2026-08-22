using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Domain.Entities;

public sealed class Assessment : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public LearningProgram? Program { get; set; }

    public string Title { get; set; } = string.Empty;

    public string AssessmentType { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public decimal PassingPercentage { get; set; }

    public bool IsAiPowered { get; set; }

    public bool IsPublished { get; set; }

    public ICollection<AssessmentQuestion> Questions { get; set; } = [];
}

public sealed class AssessmentQuestion : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid AssessmentId { get; set; }

    public Assessment? Assessment { get; set; }

    public string QuestionType { get; set; } = string.Empty;

    public string Prompt { get; set; } = string.Empty;

    public string OptionsJson { get; set; } = "[]";

    public string? CorrectAnswer { get; set; }

    public decimal Score { get; set; } = 1;

    public int SortOrder { get; set; }
}

public sealed class AssessmentAttempt : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid AssessmentId { get; set; }

    public Assessment? Assessment { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Enrollment? Enrollment { get; set; }

    public AssessmentAttemptStatus Status { get; set; } = AssessmentAttemptStatus.Started;

    public DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset? SubmittedAt { get; set; }

    public decimal? Score { get; set; }

    public string? ResultJson { get; set; }
}

public sealed class AiInterviewAttempt : AuditableEntity
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public string JobRole { get; set; } = string.Empty;

    public string Domain { get; set; } = string.Empty;

    public string InterviewType { get; set; } = string.Empty;

    public decimal? TechnicalScore { get; set; }

    public decimal? CommunicationScore { get; set; }

    public decimal? OverallScore { get; set; }

    public string? TranscriptJson { get; set; }

    public string? RecommendationsJson { get; set; }

    public AssessmentAttemptStatus Status { get; set; } = AssessmentAttemptStatus.Started;

    public DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }
}
