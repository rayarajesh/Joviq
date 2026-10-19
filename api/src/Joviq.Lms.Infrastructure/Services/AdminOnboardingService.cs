using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Students;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class AdminOnboardingService(ApplicationDbContext db) : IAdminOnboardingService
{
    private IQueryable<AdminOnboardingRecord> Records() =>
        from profile in db.StudentProfiles.AsNoTracking()
        join user in db.Users.AsNoTracking() on profile.UserId equals user.Id
        where profile.OnboardingSubmittedAt != null
        select new AdminOnboardingRecord
        {
            UserId = user.Id, StudentName = user.FullName, StudentEmail = user.Email ?? "", PhoneNumber = user.PhoneNumber,
            WhatsAppNumber = profile.WhatsAppNumber, CollegeName = profile.College, CurrentYearOfStudy = profile.CurrentYearOfStudy,
            Category = profile.PreferredCategoryName, ProgramSlug = profile.PreferredProgramSlug, Program = profile.PreferredProgramTitle,
            PreferredStartDate = profile.PreferredStartDate, ExecutiveName = profile.ExecutiveName,
            SubmittedAt = profile.OnboardingSubmittedAt!.Value, Status = profile.OnboardingReviewStatus ?? "Submitted"
        };

    public async Task<PagedResult<AdminOnboardingRecord>> ListAsync(AdminOnboardingRequest request, CancellationToken cancellationToken)
    {
        var query = Records();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x => x.StudentName.ToLower().Contains(search) || x.StudentEmail.ToLower().Contains(search));
        }
        if (!string.IsNullOrWhiteSpace(request.Category)) query = query.Where(x => x.Category == request.Category);
        if (!string.IsNullOrWhiteSpace(request.Program)) query = query.Where(x => x.ProgramSlug == request.Program);
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(x => x.Status == request.Status);
        var count = await query.CountAsync(cancellationToken);
        var ordered = request.OldestFirst ? query.OrderBy(x => x.SubmittedAt) : query.OrderByDescending(x => x.SubmittedAt);
        var page = Math.Max(1, request.Page);
        var size = Math.Clamp(request.PageSize, 1, 100);
        return new PagedResult<AdminOnboardingRecord>
        {
            Items = await ordered.ThenBy(x => x.UserId).Skip((page - 1) * size).Take(size).ToListAsync(cancellationToken),
            TotalCount = count, Page = page, PageSize = size
        };
    }

    public async Task<AdminOnboardingRecord> GetAsync(Guid userId, CancellationToken cancellationToken) =>
        await Records().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
        ?? throw new AppException("Onboarding submission was not found.", 404, "onboarding_not_found");

    public async Task<OnboardingFilterOptions> FiltersAsync(CancellationToken cancellationToken)
    {
        var profiles = db.StudentProfiles.AsNoTracking().Where(x => x.OnboardingSubmittedAt != null);
        var categories = await profiles.Where(x => x.PreferredCategoryName != null).Select(x => x.PreferredCategoryName!).Distinct().OrderBy(x => x).ToListAsync(cancellationToken);
        var programs = await profiles.Where(x => x.PreferredProgramSlug != null && x.PreferredProgramTitle != null)
            .Select(x => new { Slug = x.PreferredProgramSlug!, Title = x.PreferredProgramTitle!, Category = x.PreferredCategoryName ?? "" })
            .Distinct().OrderBy(x => x.Title).ToListAsync(cancellationToken);
        return new(categories, programs.Select(x => new OnboardingProgramOption(x.Slug, x.Title, x.Category)).ToList());
    }

    public async Task<AdminOnboardingRecord> UpdateStatusAsync(Guid userId, string status, CancellationToken cancellationToken)
    {
        if (status is not ("Submitted" or "In Review" or "Approved" or "Rejected"))
            throw new AppException("Choose a valid onboarding review status.", 400, "invalid_onboarding_status");
        var profile = await db.StudentProfiles.SingleOrDefaultAsync(x => x.UserId == userId && x.OnboardingSubmittedAt != null, cancellationToken)
            ?? throw new AppException("Onboarding submission was not found.", 404, "onboarding_not_found");
        profile.OnboardingReviewStatus = status;
        await db.SaveChangesAsync(cancellationToken);
        return await GetAsync(userId, cancellationToken);
    }
}
