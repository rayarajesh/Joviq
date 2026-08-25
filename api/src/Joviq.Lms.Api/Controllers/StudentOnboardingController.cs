using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Students;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "StudentOnly")]
[Route("api/v1/student/onboarding")]
public sealed class StudentOnboardingController(
    IStudentOnboardingService studentOnboardingService,
    ICurrentUserService currentUser,
    IWebHostEnvironment webHostEnvironment)
    : ApiControllerBase(currentUser)
{
    private const long MaxProfilePhotoBytes = 2 * 1024 * 1024;
    private const long MaxProfilePhotoRequestBytes = MaxProfilePhotoBytes + (256 * 1024);
    private const long MaxResumeBytes = 5 * 1024 * 1024;
    private const long MaxResumeRequestBytes = MaxResumeBytes + (512 * 1024);

    private static readonly HashSet<string> AllowedProfilePhotoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly HashSet<string> AllowedResumeExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".doc",
        ".docx"
    };

    [HttpGet]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> Get(CancellationToken cancellationToken)
    {
        var result = await studentOnboardingService.GetAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Student onboarding loaded.", CorrelationId));
    }

    [HttpPut("personal")]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> UpdatePersonal(
        UpdatePersonalDetailsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await studentOnboardingService.UpdatePersonalAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Personal details saved.", CorrelationId));
    }

    [HttpPut("academic")]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> UpdateAcademic(
        UpdateAcademicDetailsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await studentOnboardingService.UpdateAcademicAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Academic details saved.", CorrelationId));
    }

    [HttpPut("career")]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> UpdateCareer(
        UpdateCareerDetailsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await studentOnboardingService.UpdateCareerAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Career details saved.", CorrelationId));
    }

    [HttpPost("profile-photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxProfilePhotoRequestBytes)]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> UploadProfilePhoto(
        [FromForm] ProfilePhotoUploadForm request,
        CancellationToken cancellationToken)
    {
        var photo = request.Photo;
        if (photo is null)
        {
            throw new AppException("Profile photo is required.", 400, "profile_photo_required");
        }

        var current = await studentOnboardingService.GetAsync(RequiredUserId, cancellationToken);
        var savedPhoto = await SaveProfilePhotoAsync(photo, RequiredUserId, cancellationToken);

        try
        {
            var result = await studentOnboardingService.SetProfilePhotoAsync(
                RequiredUserId,
                new SetProfilePhotoRequest { ProfilePhotoUrl = savedPhoto.Url },
                cancellationToken);

            DeleteLocalProfilePhoto(current.ProfilePhotoUrl);
            return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Profile photo updated.", CorrelationId));
        }
        catch
        {
            DeleteLocalProfilePhoto(savedPhoto.Url);
            throw;
        }
    }

    [HttpDelete("profile-photo")]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> DeleteProfilePhoto(CancellationToken cancellationToken)
    {
        var current = await studentOnboardingService.GetAsync(RequiredUserId, cancellationToken);
        var result = await studentOnboardingService.DeleteProfilePhotoAsync(RequiredUserId, cancellationToken);
        DeleteLocalProfilePhoto(current.ProfilePhotoUrl);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Profile photo removed.", CorrelationId));
    }

    [HttpPost("resume")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxResumeRequestBytes)]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> UploadResume(
        [FromForm] ResumeUploadForm request,
        CancellationToken cancellationToken)
    {
        var resume = request.Resume;
        if (resume is null)
        {
            throw new AppException("Resume file is required.", 400, "resume_required");
        }

        var current = await studentOnboardingService.GetAsync(RequiredUserId, cancellationToken);
        var savedResume = await SaveResumeAsync(resume, RequiredUserId, cancellationToken);

        try
        {
            var result = await studentOnboardingService.SetResumeAsync(
                RequiredUserId,
                new SetResumeRequest
                {
                    ResumeUrl = savedResume.Url,
                    ResumeFileName = savedResume.OriginalFileName,
                    ResumeContentType = savedResume.ContentType,
                    ResumeSizeBytes = savedResume.SizeBytes
                },
                cancellationToken);

            DeleteLocalResume(current.Resume.ResumeUrl);
            return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Resume uploaded.", CorrelationId));
        }
        catch
        {
            DeleteLocalResume(savedResume.Url);
            throw;
        }
    }

    [HttpDelete("resume")]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> DeleteResume(CancellationToken cancellationToken)
    {
        var current = await studentOnboardingService.GetAsync(RequiredUserId, cancellationToken);
        var result = await studentOnboardingService.DeleteResumeAsync(RequiredUserId, cancellationToken);
        DeleteLocalResume(current.Resume.ResumeUrl);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Resume removed.", CorrelationId));
    }

    [HttpPost("complete")]
    public async Task<ActionResult<ApiResponse<StudentOnboardingResponse>>> Complete(CancellationToken cancellationToken)
    {
        var result = await studentOnboardingService.CompleteAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<StudentOnboardingResponse>.Ok(result, "Student onboarding completed.", CorrelationId));
    }

    private async Task<SavedProfilePhoto> SaveProfilePhotoAsync(IFormFile photo, Guid userId, CancellationToken cancellationToken)
    {
        if (photo.Length <= 0)
        {
            throw new AppException("Profile photo file is empty.", 400, "profile_photo_empty");
        }

        if (photo.Length > MaxProfilePhotoBytes)
        {
            throw new AppException("Profile photo must be 2 MB or smaller.", 400, "profile_photo_too_large");
        }

        var originalFileName = SanitizeFileName(photo.FileName);
        var extension = Path.GetExtension(originalFileName);
        if (!AllowedProfilePhotoExtensions.Contains(extension))
        {
            throw new AppException("Profile photo must be a JPG, PNG, or WebP image.", 400, "invalid_profile_photo_type");
        }

        var webRoot = GetWebRootPath();
        var userDirectoryName = userId.ToString("N");
        var uploadDirectory = Path.Combine(webRoot, "uploads", "profile-photos", userDirectoryName);
        Directory.CreateDirectory(uploadDirectory);

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(uploadDirectory, storedFileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await photo.CopyToAsync(stream, cancellationToken);
        }

        return new SavedProfilePhoto($"/uploads/profile-photos/{userDirectoryName}/{storedFileName}");
    }

    private async Task<SavedResume> SaveResumeAsync(IFormFile resume, Guid userId, CancellationToken cancellationToken)
    {
        if (resume.Length <= 0)
        {
            throw new AppException("Resume file is empty.", 400, "resume_empty");
        }

        if (resume.Length > MaxResumeBytes)
        {
            throw new AppException("Resume must be 5 MB or smaller.", 400, "resume_too_large");
        }

        var originalFileName = SanitizeFileName(resume.FileName);
        var extension = Path.GetExtension(originalFileName);
        if (!AllowedResumeExtensions.Contains(extension))
        {
            throw new AppException("Resume must be a PDF, DOC, or DOCX file.", 400, "invalid_resume_type");
        }

        var webRoot = GetWebRootPath();
        var userDirectoryName = userId.ToString("N");
        var uploadDirectory = Path.Combine(webRoot, "uploads", "resumes", userDirectoryName);
        Directory.CreateDirectory(uploadDirectory);

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(uploadDirectory, storedFileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await resume.CopyToAsync(stream, cancellationToken);
        }

        return new SavedResume(
            $"/uploads/resumes/{userDirectoryName}/{storedFileName}",
            originalFileName,
            string.IsNullOrWhiteSpace(resume.ContentType) ? "application/octet-stream" : resume.ContentType,
            resume.Length);
    }

    private void DeleteLocalResume(string? resumeUrl)
    {
        if (string.IsNullOrWhiteSpace(resumeUrl) || !resumeUrl.StartsWith("/uploads/resumes/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var relativePath = resumeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(GetWebRootPath(), relativePath));
        var uploadsRoot = Path.GetFullPath(Path.Combine(GetWebRootPath(), "uploads", "resumes"));

        if (!fullPath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(fullPath))
        {
            return;
        }

        System.IO.File.Delete(fullPath);
    }

    private void DeleteLocalProfilePhoto(string? profilePhotoUrl)
    {
        if (string.IsNullOrWhiteSpace(profilePhotoUrl) ||
            !profilePhotoUrl.StartsWith("/uploads/profile-photos/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var relativePath = profilePhotoUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(GetWebRootPath(), relativePath));
        var uploadsRoot = Path.GetFullPath(Path.Combine(GetWebRootPath(), "uploads", "profile-photos"));

        if (!fullPath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(fullPath))
        {
            return;
        }

        System.IO.File.Delete(fullPath);
    }

    private string GetWebRootPath()
    {
        var webRoot = webHostEnvironment.WebRootPath ?? Path.Combine(webHostEnvironment.ContentRootPath, "wwwroot");
        Directory.CreateDirectory(webRoot);
        return webRoot;
    }

    private static string SanitizeFileName(string fileName)
    {
        var safeName = Path.GetFileName(fileName);
        foreach (var invalidChar in Path.GetInvalidFileNameChars())
        {
            safeName = safeName.Replace(invalidChar, '_');
        }

        return string.IsNullOrWhiteSpace(safeName) ? "resume.pdf" : safeName;
    }

    private sealed record SavedProfilePhoto(string Url);

    private sealed record SavedResume(string Url, string OriginalFileName, string ContentType, long SizeBytes);
}

public sealed class ProfilePhotoUploadForm
{
    public IFormFile? Photo { get; init; }
}

public sealed class ResumeUploadForm
{
    public IFormFile? Resume { get; init; }
}
