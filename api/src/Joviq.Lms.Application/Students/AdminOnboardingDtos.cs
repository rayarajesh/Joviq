using System.ComponentModel.DataAnnotations;
using Joviq.Lms.Application.Common.Models;

namespace Joviq.Lms.Application.Students;

public sealed record AdminOnboardingRequest
{
    [MaxLength(200)] public string? Search { get; init; }
    [MaxLength(160)] public string? Category { get; init; }
    [MaxLength(160)] public string? Program { get; init; }
    [RegularExpression("^(Submitted|In Review|Approved|Rejected)$")] public string? Status { get; init; }
    public bool OldestFirst { get; init; }
    [Range(1, int.MaxValue)] public int Page { get; init; } = 1;
    [Range(1, 100)] public int PageSize { get; init; } = 20;
}

public sealed record AdminOnboardingRecord
{
    public Guid UserId { get; init; }
    public string StudentName { get; init; } = "";
    public string StudentEmail { get; init; } = "";
    public string? PhoneNumber { get; init; }
    public string? WhatsAppNumber { get; init; }
    public string? CollegeName { get; init; }
    public string? CurrentYearOfStudy { get; init; }
    public string? Category { get; init; }
    public string? ProgramSlug { get; init; }
    public string? Program { get; init; }
    public DateOnly? PreferredStartDate { get; init; }
    public string? ExecutiveName { get; init; }
    public DateTimeOffset SubmittedAt { get; init; }
    public string Status { get; init; } = "Submitted";
}

public sealed record OnboardingProgramOption(string Slug, string Title, string Category);
public sealed record OnboardingFilterOptions(IReadOnlyList<string> Categories, IReadOnlyList<OnboardingProgramOption> Programs);
public sealed record UpdateOnboardingStatusRequest
{
    [Required, RegularExpression("^(Submitted|In Review|Approved|Rejected)$")]
    public string Status { get; init; } = "";
}

public interface IAdminOnboardingService
{
    Task<PagedResult<AdminOnboardingRecord>> ListAsync(AdminOnboardingRequest request, CancellationToken cancellationToken);
    Task<AdminOnboardingRecord> GetAsync(Guid userId, CancellationToken cancellationToken);
    Task<OnboardingFilterOptions> FiltersAsync(CancellationToken cancellationToken);
    Task<AdminOnboardingRecord> UpdateStatusAsync(Guid userId, string status, CancellationToken cancellationToken);
}
