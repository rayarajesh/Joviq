using System.Globalization;
using System.Text.Json;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Students;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class StudentOnboardingService(
    ApplicationDbContext dbContext,
    IDateTimeProvider clock) : IStudentOnboardingService
{
    private const int RequiredFieldCount = 15;

    public async Task<StudentOnboardingResponse> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: true, cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> UpdatePersonalAsync(
        Guid userId,
        UpdatePersonalDetailsRequest request,
        CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        pair.User.DateOfBirth = ParseDateOfBirth(request.DateOfBirth);
        pair.User.Address = RequiredTrim(request.Address, nameof(request.Address));
        pair.User.City = RequiredTrim(request.City, nameof(request.City));
        pair.User.State = RequiredTrim(request.State, nameof(request.State));
        MarkInProgress(pair.User);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> UpdateAcademicAsync(
        Guid userId,
        UpdateAcademicDetailsRequest request,
        CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        pair.Profile.College = RequiredTrim(request.College, nameof(request.College));
        pair.Profile.Degree = RequiredTrim(request.Degree, nameof(request.Degree));
        pair.Profile.Branch = RequiredTrim(request.Branch, nameof(request.Branch));
        pair.Profile.GraduationYear = request.GraduationYear;
        pair.Profile.CgpaOrPercentage = RequiredTrim(request.CgpaOrPercentage, nameof(request.CgpaOrPercentage));
        MarkInProgress(pair.User);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> UpdateCareerAsync(
        Guid userId,
        UpdateCareerDetailsRequest request,
        CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);
        var skills = NormalizeSkills(request.Skills);

        pair.Profile.TargetJobRole = RequiredTrim(request.TargetJobRole, nameof(request.TargetJobRole));
        pair.Profile.SkillsJson = JsonSerializer.Serialize(skills);
        pair.Profile.LinkedInUrl = RequiredTrim(request.LinkedInUrl, nameof(request.LinkedInUrl));
        pair.Profile.GitHubUrl = RequiredTrim(request.GitHubUrl, nameof(request.GitHubUrl));
        pair.Profile.PortfolioUrl = RequiredTrim(request.PortfolioUrl, nameof(request.PortfolioUrl));
        MarkInProgress(pair.User);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> SetResumeAsync(
        Guid userId,
        SetResumeRequest request,
        CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        pair.Profile.ResumeUrl = RequiredTrim(request.ResumeUrl, nameof(request.ResumeUrl));
        pair.Profile.ResumeFileName = RequiredTrim(request.ResumeFileName, nameof(request.ResumeFileName));
        pair.Profile.ResumeContentType = RequiredTrim(request.ResumeContentType, nameof(request.ResumeContentType));
        pair.Profile.ResumeSizeBytes = request.ResumeSizeBytes;
        pair.Profile.ResumeUploadedAt = clock.UtcNow;
        MarkInProgress(pair.User);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> DeleteResumeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        pair.Profile.ResumeUrl = null;
        pair.Profile.ResumeFileName = null;
        pair.Profile.ResumeContentType = null;
        pair.Profile.ResumeSizeBytes = null;
        pair.Profile.ResumeUploadedAt = null;
        pair.User.OnboardingStatus = OnboardingStatus.InProgress;

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> CompleteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);
        var missingFields = GetMissingFields(pair.User, pair.Profile);

        if (missingFields.Count > 0)
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                ["Profile"] = [$"Complete these fields before continuing: {string.Join(", ", missingFields)}."]
            });
        }

        pair.User.OnboardingStatus = OnboardingStatus.Completed;
        await dbContext.SaveChangesAsync(cancellationToken);

        return BuildResponse(pair.User, pair.Profile);
    }

    private async Task<UserProfilePair> GetUserAndProfileAsync(
        Guid userId,
        bool saveIfCreated,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new AppException("User was not found.", 404, "user_not_found");

        var profile = await dbContext.StudentProfiles.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (profile is null)
        {
            profile = new StudentProfile { UserId = userId };
            dbContext.StudentProfiles.Add(profile);

            if (saveIfCreated)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        return new UserProfilePair(user, profile);
    }

    private StudentOnboardingResponse BuildResponse(ApplicationUser user, StudentProfile profile)
    {
        var skills = ReadSkills(profile.SkillsJson);
        var missingFields = GetMissingFields(user, profile, skills);
        var completionPercentage = (int)Math.Round((RequiredFieldCount - missingFields.Count) / (double)RequiredFieldCount * 100);

        return new StudentOnboardingResponse(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            user.PhoneNumber,
            user.EmailConfirmed,
            user.PhoneNumberConfirmed,
            user.OnboardingStatus.ToString(),
            new PersonalDetailsResponse(
                FormatDate(user.DateOfBirth),
                user.Address,
                user.City,
                user.State),
            new AcademicDetailsResponse(
                profile.College,
                profile.Degree,
                profile.Branch,
                profile.GraduationYear,
                profile.CgpaOrPercentage),
            new CareerDetailsResponse(
                profile.TargetJobRole,
                skills,
                profile.LinkedInUrl,
                profile.GitHubUrl,
                profile.PortfolioUrl),
            new ResumeDetailsResponse(
                profile.ResumeUrl,
                profile.ResumeFileName,
                profile.ResumeContentType,
                profile.ResumeSizeBytes,
                profile.ResumeUploadedAt),
            completionPercentage,
            missingFields);
    }

    private List<string> GetMissingFields(ApplicationUser user, StudentProfile profile)
    {
        return GetMissingFields(user, profile, ReadSkills(profile.SkillsJson));
    }

    private static List<string> GetMissingFields(ApplicationUser user, StudentProfile profile, IReadOnlyList<string> skills)
    {
        var missing = new List<string>();

        AddIfMissing(missing, "Date of birth", user.DateOfBirth.HasValue);
        AddIfMissing(missing, "Address", HasValue(user.Address));
        AddIfMissing(missing, "City", HasValue(user.City));
        AddIfMissing(missing, "State", HasValue(user.State));
        AddIfMissing(missing, "College", HasValue(profile.College));
        AddIfMissing(missing, "Degree", HasValue(profile.Degree));
        AddIfMissing(missing, "Branch", HasValue(profile.Branch));
        AddIfMissing(missing, "Graduation year", profile.GraduationYear.HasValue);
        AddIfMissing(missing, "CGPA/Percentage", HasValue(profile.CgpaOrPercentage));
        AddIfMissing(missing, "Target job role", HasValue(profile.TargetJobRole));
        AddIfMissing(missing, "Skills", skills.Count > 0);
        AddIfMissing(missing, "Resume", HasValue(profile.ResumeUrl));
        AddIfMissing(missing, "LinkedIn", HasValue(profile.LinkedInUrl));
        AddIfMissing(missing, "GitHub", HasValue(profile.GitHubUrl));
        AddIfMissing(missing, "Portfolio", HasValue(profile.PortfolioUrl));

        return missing;
    }

    private DateTimeOffset ParseDateOfBirth(string value)
    {
        if (!DateOnly.TryParseExact(value.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new AppException("Date of birth must use yyyy-MM-dd format.", 400, "invalid_date_of_birth");
        }

        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        if (date > today)
        {
            throw new AppException("Date of birth cannot be in the future.", 400, "invalid_date_of_birth");
        }

        if (date < today.AddYears(-90))
        {
            throw new AppException("Date of birth looks too far in the past.", 400, "invalid_date_of_birth");
        }

        return new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
    }

    private static List<string> NormalizeSkills(IEnumerable<string> skills)
    {
        var normalized = skills
            .Select(skill => skill.Trim())
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count == 0)
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [nameof(UpdateCareerDetailsRequest.Skills)] = ["Add at least one skill."]
            });
        }

        if (normalized.Count > 30 || normalized.Any(skill => skill.Length > 80))
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [nameof(UpdateCareerDetailsRequest.Skills)] = ["Add up to 30 skills, with each skill under 80 characters."]
            });
        }

        return normalized;
    }

    private static IReadOnlyList<string> ReadSkills(string? skillsJson)
    {
        if (string.IsNullOrWhiteSpace(skillsJson))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<string>>(skillsJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string RequiredTrim(string value, string fieldName)
    {
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [fieldName] = [$"{fieldName} is required."]
            });
        }

        return trimmed;
    }

    private static string? FormatDate(DateTimeOffset? date)
    {
        return date?.UtcDateTime.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    }

    private static bool HasValue(string? value)
    {
        return !string.IsNullOrWhiteSpace(value);
    }

    private static void AddIfMissing(List<string> missing, string label, bool isPresent)
    {
        if (!isPresent)
        {
            missing.Add(label);
        }
    }

    private static void MarkInProgress(ApplicationUser user)
    {
        if (user.OnboardingStatus == OnboardingStatus.NotStarted)
        {
            user.OnboardingStatus = OnboardingStatus.InProgress;
        }
    }

    private sealed record UserProfilePair(ApplicationUser User, StudentProfile Profile);
}
