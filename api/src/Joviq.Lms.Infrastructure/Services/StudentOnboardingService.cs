using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
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
    private const int MaximumSkillCount = 15;

    private static readonly Regex NameLikeRegex = new("^[A-Za-z][A-Za-z .'-]*$", RegexOptions.Compiled);
    private static readonly Regex RoleRegex = new("^[A-Za-z0-9][A-Za-z0-9 &#+./()_-]*$", RegexOptions.Compiled);
    private static readonly Regex SkillRegex = new("^[A-Za-z0-9][A-Za-z0-9 #+./-]*$", RegexOptions.Compiled);
    private static readonly Regex ScoreRegex = new(@"^(\d{1,3}(?:\.\d{1,2})?)\s*(%|percentage|cgpa)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

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

        pair.User.DateOfBirth = ParseOptionalDateOfBirth(request.DateOfBirth);
        pair.User.Address = ValidateOptionalLength(request.Address, nameof(request.Address), minLength: 3, maxLength: 500);
        pair.User.City = ValidateOptionalNameLike(request.City, nameof(request.City));
        pair.User.State = ValidateOptionalNameLike(request.State, nameof(request.State));
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

        pair.Profile.College = ValidateOptionalLength(request.College, nameof(request.College), minLength: 2, maxLength: 200);
        pair.Profile.Degree = ValidateOptionalLength(request.Degree, nameof(request.Degree), minLength: 2, maxLength: 120);
        pair.Profile.Branch = ValidateOptionalLength(request.Branch, nameof(request.Branch), minLength: 2, maxLength: 120);
        pair.Profile.GraduationYear = ValidateOptionalGraduationYear(request.GraduationYear);
        pair.Profile.CgpaOrPercentage = ValidateOptionalCgpaOrPercentage(request.CgpaOrPercentage);
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

        pair.Profile.TargetJobRole = ValidateOptionalCareerText(request.TargetJobRole, nameof(request.TargetJobRole), minLength: 2, maxLength: 80, RoleRegex);
        pair.Profile.SkillsJson = JsonSerializer.Serialize(skills);
        pair.Profile.LinkedInUrl = ValidateOptionalUrlForHost(request.LinkedInUrl, nameof(request.LinkedInUrl), "linkedin.com");
        pair.Profile.GitHubUrl = ValidateOptionalUrlForHost(request.GitHubUrl, nameof(request.GitHubUrl), "github.com");
        pair.Profile.PortfolioUrl = ValidateOptionalHttpUrl(request.PortfolioUrl, nameof(request.PortfolioUrl));
        MarkInProgress(pair.User);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> SetProfilePhotoAsync(
        Guid userId,
        SetProfilePhotoRequest request,
        CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        pair.User.ProfilePhotoUrl = RequiredTrim(request.ProfilePhotoUrl, nameof(request.ProfilePhotoUrl));

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> DeleteProfilePhotoAsync(Guid userId, CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        pair.User.ProfilePhotoUrl = null;

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
        MarkInProgress(pair.User);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(pair.User, pair.Profile);
    }

    public async Task<StudentOnboardingResponse> CompleteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var pair = await GetUserAndProfileAsync(userId, saveIfCreated: false, cancellationToken);

        EnsureProfileDataIsValid(pair.User, pair.Profile);

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
            user.ProfilePhotoUrl,
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

    private DateTimeOffset? ParseOptionalDateOfBirth(string? value)
    {
        var trimmed = NormalizeOptionalText(value);
        if (trimmed is null)
        {
            return null;
        }

        if (!DateOnly.TryParseExact(trimmed, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
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

        if (date > today.AddYears(-13))
        {
            throw new AppException("Student must be at least 13 years old.", 400, "invalid_date_of_birth");
        }

        return new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
    }

    private int? ValidateOptionalGraduationYear(int? graduationYear)
    {
        if (!graduationYear.HasValue)
        {
            return null;
        }

        var year = graduationYear.Value;
        var maxGraduationYear = clock.UtcNow.Year + 8;
        if (year < 2000 || year > maxGraduationYear)
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [nameof(UpdateAcademicDetailsRequest.GraduationYear)] = [$"Graduation year must be between 2000 and {maxGraduationYear}."]
            });
        }

        return year;
    }

    private static List<string> NormalizeSkills(IEnumerable<string>? skills)
    {
        var normalized = (skills ?? [])
            .Select(skill => skill.Trim())
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count > MaximumSkillCount || normalized.Any(skill => !IsCareerTokenValid(skill, minLength: 2, maxLength: 40, SkillRegex)))
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [nameof(UpdateCareerDetailsRequest.Skills)] = [$"Add up to {MaximumSkillCount} valid skills, with each skill under 40 characters."]
            });
        }

        return normalized;
    }

    private static string? ValidateOptionalLength(string? value, string fieldName, int minLength, int maxLength)
    {
        var trimmed = NormalizeOptionalText(value);
        if (trimmed is null)
        {
            return null;
        }

        if (trimmed.Length < minLength || trimmed.Length > maxLength)
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [fieldName] = [$"{fieldName} must be {minLength} to {maxLength} characters."]
            });
        }

        return trimmed;
    }

    private static string? ValidateOptionalNameLike(string? value, string fieldName)
    {
        var trimmed = ValidateOptionalLength(value, fieldName, minLength: 2, maxLength: 120);
        if (trimmed is null)
        {
            return null;
        }

        if (!NameLikeRegex.IsMatch(trimmed))
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [fieldName] = [$"{fieldName} must contain only letters, spaces, periods, apostrophes, or hyphens."]
            });
        }

        return trimmed;
    }

    private static string? ValidateOptionalCareerText(string? value, string fieldName, int minLength, int maxLength, Regex pattern)
    {
        var trimmed = ValidateOptionalLength(value, fieldName, minLength, maxLength);
        if (trimmed is null)
        {
            return null;
        }

        if (!IsCareerTokenValid(trimmed, minLength, maxLength, pattern))
        {
            throw new ValidationAppException(new Dictionary<string, string[]>
            {
                [fieldName] = [$"{fieldName} contains unsupported characters."]
            });
        }

        return trimmed;
    }

    private static string? ValidateOptionalCgpaOrPercentage(string? value)
    {
        var trimmed = NormalizeOptionalText(value);
        if (trimmed is null)
        {
            return null;
        }

        var match = ScoreRegex.Match(trimmed);
        if (!match.Success || !decimal.TryParse(match.Groups[1].Value, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var score))
        {
            throw InvalidScore();
        }

        var unit = match.Groups[2].Value.ToLowerInvariant();
        var isValid = unit switch
        {
            "%" or "percentage" => score <= 100,
            "cgpa" => score <= 10,
            _ => score <= 10 || score <= 100
        };

        if (!isValid || score < 0)
        {
            throw InvalidScore();
        }

        return trimmed;

        static ValidationAppException InvalidScore()
        {
            return new ValidationAppException(new Dictionary<string, string[]>
            {
                [nameof(UpdateAcademicDetailsRequest.CgpaOrPercentage)] = ["Enter a valid score like 8.2 CGPA or 82%."]
            });
        }
    }

    private static string? ValidateOptionalHttpUrl(string? value, string fieldName)
    {
        var trimmed = NormalizeOptionalText(value);
        if (trimmed is null)
        {
            return null;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
            (uri.Scheme is not "http" and not "https") ||
            string.IsNullOrWhiteSpace(uri.Host) ||
            !uri.Host.Contains('.'))
        {
            throw InvalidUrl(fieldName, "Enter a valid URL.");
        }

        return trimmed;
    }

    private static string? ValidateOptionalUrlForHost(string? value, string fieldName, string expectedHost)
    {
        var trimmed = ValidateOptionalHttpUrl(value, fieldName);
        if (trimmed is null)
        {
            return null;
        }

        var host = new Uri(trimmed).Host.ToLowerInvariant();
        if (host != expectedHost && !host.EndsWith($".{expectedHost}", StringComparison.OrdinalIgnoreCase))
        {
            throw InvalidUrl(fieldName, $"Enter a valid {expectedHost} profile URL.");
        }

        return trimmed;
    }

    private void EnsureProfileDataIsValid(ApplicationUser user, StudentProfile profile)
    {
        _ = ParseOptionalDateOfBirth(FormatDate(user.DateOfBirth));
        _ = ValidateOptionalLength(user.Address, nameof(UpdatePersonalDetailsRequest.Address), minLength: 3, maxLength: 500);
        _ = ValidateOptionalNameLike(user.City, nameof(UpdatePersonalDetailsRequest.City));
        _ = ValidateOptionalNameLike(user.State, nameof(UpdatePersonalDetailsRequest.State));
        _ = ValidateOptionalLength(profile.College, nameof(UpdateAcademicDetailsRequest.College), minLength: 2, maxLength: 200);
        _ = ValidateOptionalLength(profile.Degree, nameof(UpdateAcademicDetailsRequest.Degree), minLength: 2, maxLength: 120);
        _ = ValidateOptionalLength(profile.Branch, nameof(UpdateAcademicDetailsRequest.Branch), minLength: 2, maxLength: 120);
        _ = ValidateOptionalGraduationYear(profile.GraduationYear);
        _ = ValidateOptionalCgpaOrPercentage(profile.CgpaOrPercentage);
        _ = ValidateOptionalCareerText(profile.TargetJobRole, nameof(UpdateCareerDetailsRequest.TargetJobRole), minLength: 2, maxLength: 80, RoleRegex);
        _ = NormalizeSkills(ReadSkills(profile.SkillsJson));
        _ = ValidateOptionalUrlForHost(profile.LinkedInUrl, nameof(UpdateCareerDetailsRequest.LinkedInUrl), "linkedin.com");
        _ = ValidateOptionalUrlForHost(profile.GitHubUrl, nameof(UpdateCareerDetailsRequest.GitHubUrl), "github.com");
        _ = ValidateOptionalHttpUrl(profile.PortfolioUrl, nameof(UpdateCareerDetailsRequest.PortfolioUrl));
    }

    private static bool IsCareerTokenValid(string value, int minLength, int maxLength, Regex pattern)
    {
        return value.Length >= minLength && value.Length <= maxLength && pattern.IsMatch(value);
    }

    private static ValidationAppException InvalidUrl(string fieldName, string message)
    {
        return new ValidationAppException(new Dictionary<string, string[]>
        {
            [fieldName] = [message]
        });
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

    private static string? NormalizeOptionalText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return Regex.Replace(value.Trim(), @"\s+", " ");
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
