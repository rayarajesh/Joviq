using System.Net.Mail;
using System.Text.Json;
using System.Text.RegularExpressions;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Validation;
using Joviq.Lms.Application.Lms;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class LmsPortalService(
    ApplicationDbContext dbContext,
    IDateTimeProvider clock,
    IAuditLogService auditLog) : ILmsPortalService
{
    private const string DefaultThumbnailUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=82";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);
    private static readonly Regex LocalAssetFilePathRegex = new(
        "/api/v1/assets/local-files/([0-9a-fA-F-]{36})",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private void Audit(string eventType, object? metadata = null)
        => auditLog.Add($"Lms.{eventType}", metadata);

    public async Task<IReadOnlyList<ProgramCategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        var categories = await dbContext.LearningProgramCategories
            .AsNoTracking()
            .Where(x => x.IsPublished)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

        var programs = await GetProgramsAsync(new ProgramListRequest(), cancellationToken);

        return categories
            .Select(category => new ProgramCategoryResponse(
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                category.SortOrder,
                category.IsPublished,
                programs.Where(program => program.CategoryId == category.Id).ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<ProgramSummaryResponse>> GetProgramsAsync(
        ProgramListRequest request,
        CancellationToken cancellationToken)
    {
        var query = dbContext.LearningPrograms
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Plans)
            .AsQueryable();

        if (!request.IncludeDrafts)
        {
            query = query.Where(x => x.Status == ProgramStatus.Published && x.Category != null && x.Category.IsPublished);
        }

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var categorySlug = request.CategorySlug.Trim().ToLowerInvariant();
            query = query.Where(x => x.Category != null && x.Category.Slug.ToLower() == categorySlug);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.Title.ToLower().Contains(search) ||
                x.ShortDescription.ToLower().Contains(search) ||
                x.SkillsJson.ToLower().Contains(search));
        }

        var programs = await query
            .OrderBy(x => x.Category == null ? 999 : x.Category.SortOrder)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Title)
            .ToListAsync(cancellationToken);

        return programs.Select(MapProgramSummary).ToList();
    }

    public async Task<ProgramDetailsResponse> GetProgramBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var normalizedSlug = NormalizeSlug(slug);
        var program = await dbContext.LearningPrograms
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Plans)
            .Include(x => x.Modules.OrderBy(module => module.SortOrder))
                .ThenInclude(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                    .ThenInclude(x => x.Resources)
            .FirstOrDefaultAsync(x => x.Slug == normalizedSlug, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        if (program.Status != ProgramStatus.Published)
        {
            throw new AppException("Program is not published.", 404, "program_not_found");
        }

        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(x => x.ProgramId == program.Id && x.IsPublished)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return MapProgramDetails(program, projects, new Dictionary<Guid, LessonProgress>());
    }

    public async Task<LeadCaptureResponse> CreateCallbackRequestAsync(
        CallbackRequestCreateRequest request,
        CancellationToken cancellationToken)
    {
        var entity = new CallbackRequest
        {
            Id = Guid.NewGuid(),
            FullName = RequiredText(request.FullName, nameof(request.FullName), 2, 160),
            Email = ValidateEmail(request.Email, nameof(request.Email)),
            PhoneNumber = NormalizeIndianPhone(request.PhoneNumber),
            InterestedProgram = OptionalText(request.InterestedProgram, 180),
            Notes = OptionalText(request.Notes, 1200)
        };

        dbContext.CallbackRequests.Add(entity);
        Audit("Lead.CallbackCreated", new { entity.Id, entity.Email, entity.PhoneNumber, entity.InterestedProgram });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new LeadCaptureResponse(entity.Id, entity.Status.ToString(), entity.CreatedAt);
    }

    public async Task<LeadCaptureResponse> CreateEnquiryAsync(
        EnquiryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var entity = new Enquiry
        {
            Id = Guid.NewGuid(),
            FullName = RequiredText(request.FullName, nameof(request.FullName), 2, 160),
            Email = ValidateEmail(request.Email, nameof(request.Email)),
            PhoneNumber = NormalizeIndianPhone(request.PhoneNumber),
            Topic = RequiredText(request.Topic, nameof(request.Topic), 2, 180),
            Message = RequiredText(request.Message, nameof(request.Message), 10, 2500)
        };

        dbContext.Enquiries.Add(entity);
        Audit("Lead.EnquiryCreated", new { entity.Id, entity.Email, entity.PhoneNumber, entity.Topic });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new LeadCaptureResponse(entity.Id, entity.Status.ToString(), entity.CreatedAt);
    }

    public async Task<CertificateVerificationResponse> VerifyCertificateAsync(
        string certificateId,
        CancellationToken cancellationToken)
    {
        var normalized = RequiredText(certificateId, nameof(certificateId), 4, 120);
        var certificate = await dbContext.Certificates
            .AsNoTracking()
            .Include(x => x.Program)
            .FirstOrDefaultAsync(
                x => x.CertificateId == normalized || x.VerificationSlug == normalized,
                cancellationToken)
            ?? throw new AppException("Certificate was not found.", 404, "certificate_not_found");

        var studentName = await dbContext.Users
            .Where(x => x.Id == certificate.StudentId)
            .Select(x => x.FullName)
            .FirstOrDefaultAsync(cancellationToken) ?? "Joviq Learner";

        return new CertificateVerificationResponse(
            certificate.Status == CertificateStatus.Issued,
            certificate.CertificateId,
            studentName,
            certificate.Program?.Title ?? "Joviq Program",
            certificate.Type.ToString(),
            certificate.IssuedAt,
            certificate.Status.ToString());
    }

    public async Task<StudentLmsDashboardResponse> GetStudentDashboardAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var enrollment = await GetCurrentEnrollmentAsync(studentId, cancellationToken);
        var notifications = await GetStudentNotificationsAsync(studentId, cancellationToken);

        if (enrollment is null)
        {
            return new StudentLmsDashboardResponse(
                null,
                "Not enrolled",
                0,
                0,
                0,
                0,
                null,
                0,
                notifications.Take(5).ToList());
        }

        var progress = await GetLearningProgressAsync(studentId, enrollment.ProgramId, cancellationToken);
        var projects = await GetStudentProjectsAsync(studentId, cancellationToken);
        var certificates = await GetStudentCertificatesAsync(studentId, cancellationToken);

        return new StudentLmsDashboardResponse(
            MapEnrollment(enrollment),
            enrollment.Status.ToString(),
            progress.Percentage,
            progress.Completed,
            progress.Total,
            projects.Count(x => x.LatestSubmission is null || x.LatestSubmission.Status is "Draft" or "NeedsRevision"),
            certificates.OrderByDescending(x => x.IssuedAt ?? DateTimeOffset.MinValue).FirstOrDefault(),
            Math.Max(enrollment.TotalAmount - enrollment.PaidAmount, 0),
            notifications.Take(5).ToList());
    }

    public async Task<StudentProgramWorkspaceResponse> GetStudentWorkspaceAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var enrollment = await GetCurrentEnrollmentAsync(studentId, cancellationToken);

        return new StudentProgramWorkspaceResponse(
            enrollment is null ? null : MapEnrollment(enrollment),
            enrollment is null ? [] : await GetStudentProjectsAsync(studentId, cancellationToken),
            await GetStudentCertificatesAsync(studentId, cancellationToken),
            await GetStudentPaymentsAsync(studentId, cancellationToken));
    }

    public async Task<ProgramDetailsResponse> GetStudentMyProgramAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var enrollment = await RequireEnrollmentAsync(studentId, cancellationToken);
        var program = await dbContext.LearningPrograms
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Plans)
            .Include(x => x.Modules.OrderBy(module => module.SortOrder))
                .ThenInclude(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                    .ThenInclude(x => x.Resources)
            .FirstOrDefaultAsync(x => x.Id == enrollment.ProgramId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        var lessonIds = program.Modules.SelectMany(x => x.Lessons).Select(x => x.Id).ToList();
        var progress = await dbContext.LessonProgress
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && lessonIds.Contains(x.LessonId))
            .ToDictionaryAsync(x => x.LessonId, cancellationToken);
        var projects = await dbContext.Projects.AsNoTracking().Where(x => x.ProgramId == program.Id && x.IsPublished).ToListAsync(cancellationToken);
        return MapProgramDetails(program, projects, progress);
    }

    public async Task<EnrollmentResponse> CreateEnrollmentAsync(
        Guid studentId,
        CreateEnrollmentRequest request,
        CancellationToken cancellationToken)
    {
        var program = await dbContext.LearningPrograms
            .Include(x => x.Plans)
            .FirstOrDefaultAsync(x => x.Id == request.ProgramId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        if (program.Status != ProgramStatus.Published)
        {
            throw new AppException("Program is not open for enrollment.", 400, "program_not_open");
        }

        var existing = await dbContext.Enrollments
            .Include(x => x.Program)
            .Include(x => x.ProgramPlan)
            .Where(x => x.StudentId == studentId && x.ProgramId == program.Id && x.Status != EnrollmentStatus.Cancelled)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null)
        {
            return MapEnrollment(existing);
        }

        var plan = ResolvePlan(program, request.ProgramPlanId);
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramId = program.Id,
            ProgramPlanId = plan?.Id,
            Status = EnrollmentStatus.Reserved,
            TotalAmount = plan?.OfferPrice ?? 0,
            PaidAmount = 0,
            EnrolledAt = clock.UtcNow,
            LockedReason = "Reserve payment gives preview access. Pay the remaining balance to unlock the full LMS."
        };

        dbContext.Enrollments.Add(enrollment);
        dbContext.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = studentId,
            Title = "Enrollment created",
            Body = $"Your {program.Title} enrollment is ready. Complete payment to unlock full access.",
            ActionUrl = "/dashboard"
        });

        Audit("Student.EnrollmentCreated", new { studentId, enrollment.Id, programId = program.Id, planId = plan?.Id });
        await dbContext.SaveChangesAsync(cancellationToken);
        enrollment.Program = program;
        enrollment.ProgramPlan = plan;
        return MapEnrollment(enrollment);
    }

    public async Task<PaymentTransactionResponse> CreatePaymentCheckoutAsync(
        Guid studentId,
        CreatePaymentCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var enrollment = request.EnrollmentId.HasValue
            ? await dbContext.Enrollments
                .Include(x => x.Program)
                .Include(x => x.ProgramPlan)
                .FirstOrDefaultAsync(x => x.Id == request.EnrollmentId && x.StudentId == studentId, cancellationToken)
            : await dbContext.Enrollments
                .Include(x => x.Program)
                .Include(x => x.ProgramPlan)
                .Where(x => x.StudentId == studentId && x.ProgramId == request.ProgramId && x.Status != EnrollmentStatus.Cancelled)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

        if (enrollment is null)
        {
            enrollment = await CreateEnrollmentEntityAsync(studentId, request.ProgramId, request.ProgramPlanId, cancellationToken);
        }

        var plan = enrollment.ProgramPlan;
        if (plan is null && request.ProgramPlanId.HasValue)
        {
            plan = await dbContext.ProgramPlans.FirstOrDefaultAsync(x => x.Id == request.ProgramPlanId, cancellationToken);
        }

        var amount = CalculatePaymentAmount(enrollment, plan, request.Mode);
        var transaction = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            EnrollmentId = enrollment.Id,
            ProgramId = enrollment.ProgramId,
            ProgramPlanId = enrollment.ProgramPlanId,
            Gateway = "Manual",
            GatewayOrderId = $"joviq_order_{Guid.NewGuid():N}",
            Mode = request.Mode,
            Status = PaymentStatus.Pending,
            Amount = amount
        };

        dbContext.PaymentTransactions.Add(transaction);
        Audit("Student.PaymentCheckoutCreated", new { studentId, transaction.Id, transaction.EnrollmentId, transaction.ProgramId, transaction.Mode, transaction.Amount });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPayment(transaction);
    }

    public async Task<PaymentTransactionResponse> VerifyPaymentAsync(
        Guid studentId,
        VerifyPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var transaction = await dbContext.PaymentTransactions
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.Program)
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.ProgramPlan)
            .FirstOrDefaultAsync(x =>
                    x.StudentId == studentId &&
                    ((request.PaymentTransactionId.HasValue && x.Id == request.PaymentTransactionId) ||
                     (!string.IsNullOrWhiteSpace(request.GatewayOrderId) && x.GatewayOrderId == request.GatewayOrderId)),
                cancellationToken)
            ?? throw new AppException("Payment transaction was not found.", 404, "payment_not_found");

        if (transaction.Status == PaymentStatus.Verified)
        {
            return MapPayment(transaction);
        }

        transaction.Status = PaymentStatus.Verified;
        transaction.GatewayPaymentId = OptionalText(request.GatewayPaymentId, 160) ?? $"manual_{Guid.NewGuid():N}";
        transaction.VerifiedAt = clock.UtcNow;

        if (transaction.Enrollment is not null)
        {
            transaction.Enrollment.PaidAmount += transaction.Amount;
            if (transaction.Enrollment.PaidAmount >= transaction.Enrollment.TotalAmount)
            {
                transaction.Enrollment.Status = EnrollmentStatus.Active;
                transaction.Enrollment.FullAccessUnlockedAt ??= clock.UtcNow;
                transaction.Enrollment.LockedReason = null;
            }
            else
            {
                transaction.Enrollment.Status = EnrollmentStatus.Reserved;
                transaction.Enrollment.LockedReason = "Remaining balance payment is required for full LMS access.";
            }

            dbContext.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = studentId,
                Title = "Payment verified",
                Body = $"INR {transaction.Amount:n0} payment for {transaction.Enrollment.Program?.Title ?? "your program"} is verified.",
                ActionUrl = "/dashboard"
            });
        }

        Audit("Student.PaymentVerified", new { studentId, transaction.Id, transaction.EnrollmentId, transaction.Amount, transaction.GatewayPaymentId });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPayment(transaction);
    }

    public async Task<IReadOnlyList<ProjectResponse>> GetStudentProjectsAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var enrollment = await RequireEnrollmentAsync(studentId, cancellationToken);
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(x => x.ProgramId == enrollment.ProgramId && x.IsPublished)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var projectIds = projects.Select(x => x.Id).ToList();
        var submissions = await dbContext.ProjectSubmissions
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && projectIds.Contains(x.ProjectId))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var latestByProject = submissions
            .GroupBy(x => x.ProjectId)
            .ToDictionary(group => group.Key, group => group.First());

        return projects
            .Select(project => MapProject(project, latestByProject.GetValueOrDefault(project.Id)))
            .ToList();
    }

    public async Task<SubmissionResponse> SubmitProjectAsync(
        Guid studentId,
        Guid projectId,
        SubmitProjectRequest request,
        CancellationToken cancellationToken)
    {
        var enrollment = await RequireEnrollmentAsync(studentId, cancellationToken);
        var project = await dbContext.Projects
            .FirstOrDefaultAsync(x => x.Id == projectId && x.ProgramId == enrollment.ProgramId && x.IsPublished, cancellationToken)
            ?? throw new AppException("Project was not found.", 404, "project_not_found");

        if (AllBlank(request.GitHubUrl, request.DemoUrl, request.DocumentationUrl, request.PresentationUrl, request.Notes))
        {
            throw Validation(nameof(request.GitHubUrl), "Add at least one project artifact link or notes.");
        }

        var submission = new ProjectSubmission
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            StudentId = studentId,
            EnrollmentId = enrollment.Id,
            GitHubUrl = OptionalUrl(request.GitHubUrl, nameof(request.GitHubUrl)),
            DemoUrl = OptionalUrl(request.DemoUrl, nameof(request.DemoUrl)),
            DocumentationUrl = OptionalUrl(request.DocumentationUrl, nameof(request.DocumentationUrl)),
            PresentationUrl = OptionalUrl(request.PresentationUrl, nameof(request.PresentationUrl)),
            Notes = OptionalText(request.Notes, 2000),
            Status = SubmissionStatus.Submitted
        };

        dbContext.ProjectSubmissions.Add(submission);
        Audit("Student.ProjectSubmitted", new { studentId, submissionId = submission.Id, projectId = project.Id, enrollmentId = enrollment.Id });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProjectSubmission(submission);
    }

    public async Task<IReadOnlyList<PaymentTransactionResponse>> GetStudentPaymentsAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var payments = await dbContext.PaymentTransactions
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return payments.Select(MapPayment).ToList();
    }

    public async Task<IReadOnlyList<CertificateResponse>> GetStudentCertificatesAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var certificates = await dbContext.Certificates
            .AsNoTracking()
            .Include(x => x.Program)
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.IssuedAt ?? x.CreatedAt)
            .ToListAsync(cancellationToken);

        return certificates.Select(MapCertificate).ToList();
    }

    public async Task<IReadOnlyList<NotificationResponse>> GetStudentNotificationsAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var notifications = await dbContext.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == studentId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        return notifications.Select(MapNotification).ToList();
    }

    public async Task<NotificationResponse> MarkNotificationReadAsync(
        Guid studentId,
        Guid notificationId,
        CancellationToken cancellationToken)
    {
        var notification = await dbContext.Notifications
            .FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == studentId, cancellationToken)
            ?? throw new AppException("Notification was not found.", 404, "notification_not_found");

        notification.Status = NotificationStatus.Read;
        notification.ReadAt ??= clock.UtcNow;
        Audit("Student.NotificationRead", new { studentId, notificationId });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapNotification(notification);
    }

    public async Task<AdminLmsSummaryResponse> GetAdminSummaryAsync(CancellationToken cancellationToken)
    {
        var programs = await dbContext.LearningPrograms.CountAsync(cancellationToken);
        var publishedPrograms = await dbContext.LearningPrograms.CountAsync(x => x.Status == ProgramStatus.Published, cancellationToken);
        var enrollments = await dbContext.Enrollments.CountAsync(cancellationToken);
        var activeEnrollments = await dbContext.Enrollments.CountAsync(x => x.Status == EnrollmentStatus.Active, cancellationToken);
        var revenue = await dbContext.PaymentTransactions
            .Where(x => x.Status == PaymentStatus.Verified)
            .SumAsync(x => x.Amount, cancellationToken);
        var pendingProjects = await dbContext.ProjectSubmissions
            .CountAsync(x => x.Status == SubmissionStatus.Submitted, cancellationToken);
        var callbacks = await dbContext.CallbackRequests.CountAsync(x => x.Status == LeadStatus.New, cancellationToken);

        return new AdminLmsSummaryResponse(
            programs,
            publishedPrograms,
            enrollments,
            activeEnrollments,
            revenue,
            pendingProjects,
            callbacks);
    }

    public async Task<IReadOnlyList<ProgramCategoryResponse>> GetAdminCategoriesAsync(CancellationToken cancellationToken)
    {
        var categories = await dbContext.LearningProgramCategories
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
        var programs = await GetAdminProgramsAsync(cancellationToken);

        return categories
            .Select(category => new ProgramCategoryResponse(
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                category.SortOrder,
                category.IsPublished,
                programs.Where(program => program.CategoryId == category.Id).ToList()))
            .ToList();
    }

    public async Task<ProgramCategoryResponse> CreateCategoryAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var slug = NormalizeSlug(request.Slug);
        if (await dbContext.LearningProgramCategories.AnyAsync(x => x.Slug == slug, cancellationToken))
        {
            throw new AppException("Category slug already exists.", 409, "category_slug_exists");
        }

        var category = new LearningProgramCategory
        {
            Id = Guid.NewGuid(),
            Name = RequiredText(request.Name, nameof(request.Name), 2, 120),
            Slug = slug,
            Description = RequiredText(request.Description, nameof(request.Description), 10, 600),
            IsPublished = request.IsPublished,
            SortOrder = await dbContext.LearningProgramCategories.CountAsync(cancellationToken) + 1
        };

        dbContext.LearningProgramCategories.Add(category);
        Audit("Admin.CategoryCreated", new { category.Id, category.Name, category.Slug });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ProgramCategoryResponse(category.Id, category.Name, category.Slug, category.Description, category.SortOrder, category.IsPublished, []);
    }

    public async Task<ProgramCategoryResponse> UpdateCategoryAsync(
        Guid categoryId,
        CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var category = await dbContext.LearningProgramCategories.FirstOrDefaultAsync(x => x.Id == categoryId, cancellationToken)
            ?? throw new AppException("Program category was not found.", 404, "program_category_not_found");
        var slug = NormalizeSlug(request.Slug);

        if (await dbContext.LearningProgramCategories.AnyAsync(x => x.Id != categoryId && x.Slug == slug, cancellationToken))
        {
            throw new AppException("Category slug already exists.", 409, "category_slug_exists");
        }

        category.Name = RequiredText(request.Name, nameof(request.Name), 2, 120);
        category.Slug = slug;
        category.Description = RequiredText(request.Description, nameof(request.Description), 10, 600);
        category.IsPublished = request.IsPublished;

        Audit("Admin.CategoryUpdated", new { category.Id, category.Name, category.Slug, category.IsPublished });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ProgramCategoryResponse(category.Id, category.Name, category.Slug, category.Description, category.SortOrder, category.IsPublished, []);
    }

    public Task<IReadOnlyList<ProgramSummaryResponse>> GetAdminProgramsAsync(CancellationToken cancellationToken)
    {
        return GetProgramsAsync(new ProgramListRequest { IncludeDrafts = true }, cancellationToken);
    }

    public async Task<ProgramDetailsResponse> GetAdminProgramAsync(Guid programId, CancellationToken cancellationToken)
    {
        var program = await dbContext.LearningPrograms
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Plans)
            .Include(x => x.Modules.OrderBy(module => module.SortOrder))
                .ThenInclude(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                    .ThenInclude(x => x.Resources)
            .FirstOrDefaultAsync(x => x.Id == programId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        return await LoadAdminProgramDetailsAsync(program, cancellationToken);
    }

    public async Task<ProgramDetailsResponse> CreateProgramAsync(
        CreateProgramRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);
        var slug = NormalizeSlug(request.Slug);
        if (await dbContext.LearningPrograms.AnyAsync(x => x.Slug == slug, cancellationToken))
        {
            throw new AppException("Program slug already exists.", 409, "program_slug_exists");
        }

        var program = new LearningProgram { Id = Guid.NewGuid() };
        ApplyProgramRequest(program, request);
        program.SortOrder = await dbContext.LearningPrograms.CountAsync(x => x.CategoryId == request.CategoryId, cancellationToken) + 1;

        dbContext.LearningPrograms.Add(program);
        AddDefaultProgramPlans(program);
        Audit("Admin.ProgramCreated", new { program.Id, program.Title, program.Slug, program.CategoryId, program.Status });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetProgramBySlugForAdminAsync(program.Slug, cancellationToken);
    }

    public async Task<ProgramDetailsResponse> UpdateProgramAsync(
        Guid programId,
        UpdateProgramRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);
        var slug = NormalizeSlug(request.Slug);
        var program = await dbContext.LearningPrograms.FirstOrDefaultAsync(x => x.Id == programId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        if (await dbContext.LearningPrograms.AnyAsync(x => x.Id != programId && x.Slug == slug, cancellationToken))
        {
            throw new AppException("Program slug already exists.", 409, "program_slug_exists");
        }

        ApplyProgramRequest(program, request);
        Audit("Admin.ProgramUpdated", new { program.Id, program.Title, program.Slug, program.CategoryId, program.Status });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetProgramBySlugForAdminAsync(program.Slug, cancellationToken);
    }

    public async Task DeleteProgramAsync(Guid programId, CancellationToken cancellationToken)
    {
        var program = await dbContext.LearningPrograms.FirstOrDefaultAsync(x => x.Id == programId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        program.Status = ProgramStatus.Archived;
        Audit("Admin.ProgramArchived", new { program.Id, program.Title, program.Slug });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProgramPlanResponse> CreateProgramPlanAsync(
        Guid programId,
        CreatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var program = await dbContext.LearningPrograms
            .Include(x => x.Plans)
            .FirstOrDefaultAsync(x => x.Id == programId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        var code = RequiredText(request.Code, nameof(request.Code), 2, 80).ToUpperInvariant();
        if (program.Plans.Any(x => string.Equals(x.Code, code, StringComparison.OrdinalIgnoreCase)))
        {
            throw new AppException("Plan code already exists for this program.", 409, "plan_code_exists");
        }

        EnsureMoney(request.ActualPrice, nameof(request.ActualPrice));
        EnsureMoney(request.OfferPrice, nameof(request.OfferPrice));
        EnsureMoney(request.ReserveAmount, nameof(request.ReserveAmount));

        var plan = new ProgramPlan
        {
            Id = Guid.NewGuid(),
            ProgramId = program.Id,
            Name = RequiredText(request.Name, nameof(request.Name), 2, 120),
            Code = code,
            ActualPrice = request.ActualPrice,
            OfferPrice = request.OfferPrice,
            ReserveAmount = request.ReserveAmount,
            FeaturesJson = SerializeList(request.Features),
            IsActive = request.IsActive,
            SortOrder = program.Plans.Count + 1
        };

        dbContext.ProgramPlans.Add(plan);
        Audit("Admin.ProgramPlanCreated", new { plan.Id, plan.ProgramId, plan.Code, plan.OfferPrice, plan.IsActive });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPlan(plan);
    }

    public async Task<ProgramPlanResponse> UpdateProgramPlanAsync(
        Guid planId,
        CreatePlanRequest request,
        CancellationToken cancellationToken)
    {
        var plan = await dbContext.ProgramPlans.FirstOrDefaultAsync(x => x.Id == planId, cancellationToken)
            ?? throw new AppException("Program plan was not found.", 404, "program_plan_not_found");

        EnsureMoney(request.ActualPrice, nameof(request.ActualPrice));
        EnsureMoney(request.OfferPrice, nameof(request.OfferPrice));
        EnsureMoney(request.ReserveAmount, nameof(request.ReserveAmount));

        plan.Name = RequiredText(request.Name, nameof(request.Name), 2, 120);
        plan.Code = RequiredText(request.Code, nameof(request.Code), 2, 80).ToUpperInvariant();
        plan.ActualPrice = request.ActualPrice;
        plan.OfferPrice = request.OfferPrice;
        plan.ReserveAmount = request.ReserveAmount;
        plan.FeaturesJson = SerializeList(request.Features);
        plan.IsActive = request.IsActive;

        Audit("Admin.ProgramPlanUpdated", new { plan.Id, plan.ProgramId, plan.Code, plan.OfferPrice, plan.IsActive });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPlan(plan);
    }

    public async Task<IReadOnlyList<CurriculumModuleResponse>> GetAdminCurriculumAsync(
        Guid? programId,
        CancellationToken cancellationToken)
    {
        var query = dbContext.CurriculumModules
            .AsNoTracking()
            .Include(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                .ThenInclude(x => x.Resources)
            .AsQueryable();

        if (programId.HasValue)
        {
            query = query.Where(x => x.ProgramId == programId);
        }

        var modules = await query
            .OrderBy(x => x.ProgramId)
            .ThenBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        return modules.Select(module => MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>())).ToList();
    }

    public async Task<CurriculumModuleResponse> CreateModuleAsync(
        Guid programId,
        CreateModuleRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureProgramExistsAsync(programId, cancellationToken);
        var module = new CurriculumModule
        {
            Id = Guid.NewGuid(),
            ProgramId = programId,
            Title = RequiredText(request.Title, nameof(request.Title), 2, 180),
            Description = RequiredText(request.Description, nameof(request.Description), 10, 1200),
            SortOrder = await dbContext.CurriculumModules.CountAsync(x => x.ProgramId == programId, cancellationToken) + 1
        };

        dbContext.CurriculumModules.Add(module);
        Audit("Admin.CurriculumModuleCreated", new { module.Id, module.ProgramId, module.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>());
    }

    public async Task<CurriculumModuleResponse> UpdateModuleAsync(
        Guid moduleId,
        CreateModuleRequest request,
        CancellationToken cancellationToken)
    {
        var module = await dbContext.CurriculumModules
            .Include(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
            .FirstOrDefaultAsync(x => x.Id == moduleId, cancellationToken)
            ?? throw new AppException("Curriculum module was not found.", 404, "module_not_found");

        module.Title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        module.Description = RequiredText(request.Description, nameof(request.Description), 10, 1200);

        Audit("Admin.CurriculumModuleUpdated", new { module.Id, module.ProgramId, module.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>());
    }

    public async Task<LessonResponse> CreateLessonAsync(
        Guid moduleId,
        CreateLessonRequest request,
        CancellationToken cancellationToken)
    {
        var module = await dbContext.CurriculumModules.FirstOrDefaultAsync(x => x.Id == moduleId, cancellationToken)
            ?? throw new AppException("Curriculum module was not found.", 404, "module_not_found");

        var lesson = new Lesson
        {
            Id = Guid.NewGuid(),
            ModuleId = module.Id,
            Title = RequiredText(request.Title, nameof(request.Title), 2, 180),
            Summary = RequiredText(request.Summary, nameof(request.Summary), 10, 1200),
            VideoUrl = OptionalUrl(request.VideoUrl, nameof(request.VideoUrl)),
            NotesUrl = OptionalUrl(request.NotesUrl, nameof(request.NotesUrl)),
            DurationMinutes = request.DurationMinutes <= 0 ? 45 : request.DurationMinutes,
            AccessLevel = request.AccessLevel,
            SortOrder = await dbContext.Lessons.CountAsync(x => x.ModuleId == moduleId, cancellationToken) + 1
        };

        dbContext.Lessons.Add(lesson);
        Audit("Admin.LessonCreated", new { lesson.Id, lesson.ModuleId, module.ProgramId, lesson.Title, lesson.AccessLevel });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapLesson(lesson, null, null);
    }

    public async Task<LessonResponse> UpdateLessonAsync(
        Guid lessonId,
        CreateLessonRequest request,
        CancellationToken cancellationToken)
    {
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(x => x.Id == lessonId, cancellationToken)
            ?? throw new AppException("Lesson was not found.", 404, "lesson_not_found");

        lesson.Title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        lesson.Summary = RequiredText(request.Summary, nameof(request.Summary), 10, 1200);
        lesson.VideoUrl = OptionalUrl(request.VideoUrl, nameof(request.VideoUrl));
        lesson.NotesUrl = OptionalUrl(request.NotesUrl, nameof(request.NotesUrl));
        lesson.DurationMinutes = request.DurationMinutes <= 0 ? 45 : request.DurationMinutes;
        lesson.AccessLevel = request.AccessLevel;

        Audit("Admin.LessonUpdated", new { lesson.Id, lesson.ModuleId, lesson.Title, lesson.AccessLevel });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapLesson(lesson, null, null);
    }

    public async Task<IReadOnlyList<ProjectResponse>> GetAdminProjectsAsync(CancellationToken cancellationToken)
    {
        var projects = await dbContext.Projects
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return projects.Select(x => MapProject(x, null)).ToList();
    }

    public async Task<ProjectResponse> CreateProjectAsync(
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureProgramExistsAsync(request.ProgramId, cancellationToken);
        EnsureScore(request.MaxScore, nameof(request.MaxScore));
        var project = new Project
        {
            Id = Guid.NewGuid(),
            ProgramId = request.ProgramId,
            Title = RequiredText(request.Title, nameof(request.Title), 2, 180),
            Description = RequiredText(request.Description, nameof(request.Description), 10, 2500),
            RequiredArtifactsJson = SerializeList(request.RequiredArtifacts),
            MaxScore = request.MaxScore,
            IsPublished = request.IsPublished
        };

        dbContext.Projects.Add(project);
        Audit("Admin.ProjectCreated", new { project.Id, project.ProgramId, project.Title, project.IsPublished });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProject(project, null);
    }

    public async Task<ProjectResponse> UpdateProjectAsync(
        Guid projectId,
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureProgramExistsAsync(request.ProgramId, cancellationToken);
        EnsureScore(request.MaxScore, nameof(request.MaxScore));
        var project = await dbContext.Projects.FirstOrDefaultAsync(x => x.Id == projectId, cancellationToken)
            ?? throw new AppException("Project was not found.", 404, "project_not_found");

        project.ProgramId = request.ProgramId;
        project.Title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        project.Description = RequiredText(request.Description, nameof(request.Description), 10, 2500);
        project.RequiredArtifactsJson = SerializeList(request.RequiredArtifacts);
        project.MaxScore = request.MaxScore;
        project.IsPublished = request.IsPublished;

        Audit("Admin.ProjectUpdated", new { project.Id, project.ProgramId, project.Title, project.IsPublished });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProject(project, null);
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> GetAdminEnrollmentsAsync(CancellationToken cancellationToken)
    {
        var enrollments = await dbContext.Enrollments
            .AsNoTracking()
            .Include(x => x.Program)
            .Include(x => x.ProgramPlan)
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return enrollments.Select(MapEnrollment).ToList();
    }

    public async Task<EnrollmentResponse> UpdateEnrollmentStatusAsync(
        Guid enrollmentId,
        UpdateEnrollmentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var enrollment = await dbContext.Enrollments
            .Include(x => x.Program)
            .Include(x => x.ProgramPlan)
            .FirstOrDefaultAsync(x => x.Id == enrollmentId, cancellationToken)
            ?? throw new AppException("Enrollment was not found.", 404, "enrollment_not_found");

        enrollment.Status = request.Status;
        enrollment.LockedReason = request.Status == EnrollmentStatus.Active ? null : OptionalText(request.LockedReason, 500);
        enrollment.FullAccessUnlockedAt = request.Status == EnrollmentStatus.Active
            ? enrollment.FullAccessUnlockedAt ?? clock.UtcNow
            : enrollment.FullAccessUnlockedAt;
        Audit("Admin.EnrollmentStatusUpdated", new { enrollment.Id, enrollment.StudentId, enrollment.ProgramId, enrollment.Status });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapEnrollment(enrollment);
    }

    public async Task<IReadOnlyList<PaymentTransactionResponse>> GetAdminPaymentsAsync(CancellationToken cancellationToken)
    {
        var payments = await dbContext.PaymentTransactions
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return payments.Select(MapPayment).ToList();
    }

    public async Task<PaymentTransactionResponse> UpdatePaymentStatusAsync(
        Guid paymentId,
        UpdatePaymentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await dbContext.PaymentTransactions
            .Include(x => x.Enrollment)
            .FirstOrDefaultAsync(x => x.Id == paymentId, cancellationToken)
            ?? throw new AppException("Payment was not found.", 404, "payment_not_found");

        payment.Status = request.Status;
        payment.GatewayPaymentId = OptionalText(request.GatewayPaymentId, 160);
        payment.FailureReason = OptionalText(request.FailureReason, 500);
        payment.VerifiedAt = request.Status == PaymentStatus.Verified ? clock.UtcNow : payment.VerifiedAt;

        if (request.Status == PaymentStatus.Verified && payment.Enrollment is not null)
        {
            payment.Enrollment.PaidAmount = Math.Min(payment.Enrollment.PaidAmount + payment.Amount, payment.Enrollment.TotalAmount);
            if (payment.Enrollment.PaidAmount >= payment.Enrollment.TotalAmount)
            {
                payment.Enrollment.Status = EnrollmentStatus.Active;
                payment.Enrollment.FullAccessUnlockedAt ??= clock.UtcNow;
                payment.Enrollment.LockedReason = null;
            }
        }

        Audit("Admin.PaymentStatusUpdated", new { payment.Id, payment.StudentId, payment.EnrollmentId, payment.Status, payment.Amount });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPayment(payment);
    }

    public async Task<IReadOnlyList<CouponResponse>> GetCouponsAsync(CancellationToken cancellationToken)
    {
        var coupons = await dbContext.Coupons
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return coupons.Select(MapCoupon).ToList();
    }

    public async Task<CouponResponse> CreateCouponAsync(
        CreateCouponRequest request,
        CancellationToken cancellationToken)
    {
        var code = RequiredText(request.Code, nameof(request.Code), 2, 80).ToUpperInvariant();
        if (await dbContext.Coupons.AnyAsync(x => x.Code == code, cancellationToken))
        {
            throw new AppException("Coupon code already exists.", 409, "coupon_exists");
        }

        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            Code = code,
            Description = RequiredText(request.Description, nameof(request.Description), 2, 500),
            DiscountValue = request.DiscountValue,
            IsPercentage = request.IsPercentage,
            IsActive = request.IsActive,
            StartsAt = request.StartsAt,
            ExpiresAt = request.ExpiresAt
        };

        dbContext.Coupons.Add(coupon);
        Audit("Admin.CouponCreated", new { coupon.Id, coupon.Code, coupon.DiscountValue, coupon.IsPercentage, coupon.IsActive });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCoupon(coupon);
    }

    public async Task<CouponResponse> UpdateCouponAsync(
        Guid couponId,
        CreateCouponRequest request,
        CancellationToken cancellationToken)
    {
        var coupon = await dbContext.Coupons.FirstOrDefaultAsync(x => x.Id == couponId, cancellationToken)
            ?? throw new AppException("Coupon was not found.", 404, "coupon_not_found");
        var code = RequiredText(request.Code, nameof(request.Code), 2, 80).ToUpperInvariant();

        if (await dbContext.Coupons.AnyAsync(x => x.Id != couponId && x.Code == code, cancellationToken))
        {
            throw new AppException("Coupon code already exists.", 409, "coupon_exists");
        }

        coupon.Code = code;
        coupon.Description = RequiredText(request.Description, nameof(request.Description), 2, 500);
        coupon.DiscountValue = request.DiscountValue;
        coupon.IsPercentage = request.IsPercentage;
        coupon.IsActive = request.IsActive;
        coupon.StartsAt = request.StartsAt;
        coupon.ExpiresAt = request.ExpiresAt;

        Audit("Admin.CouponUpdated", new { coupon.Id, coupon.Code, coupon.DiscountValue, coupon.IsPercentage, coupon.IsActive });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCoupon(coupon);
    }

    public async Task<IReadOnlyList<CertificateResponse>> GetAdminCertificatesAsync(CancellationToken cancellationToken)
    {
        var certificates = await dbContext.Certificates
            .AsNoTracking()
            .Include(x => x.Program)
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return certificates.Select(MapCertificate).ToList();
    }

    public async Task<CertificateResponse> IssueCertificateAsync(
        IssueCertificateRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureProgramExistsAsync(request.ProgramId, cancellationToken);
        if (!await dbContext.Users.AnyAsync(x => x.Id == request.StudentId, cancellationToken))
        {
            throw new AppException("Student was not found.", 404, "student_not_found");
        }

        var program = await dbContext.LearningPrograms.AsNoTracking().FirstAsync(x => x.Id == request.ProgramId, cancellationToken);
        var certificateId = $"JOVIQ-{clock.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
        var certificate = new Certificate
        {
            Id = Guid.NewGuid(),
            StudentId = request.StudentId,
            ProgramId = request.ProgramId,
            EnrollmentId = request.EnrollmentId,
            Type = request.Type,
            Status = CertificateStatus.Issued,
            CertificateId = certificateId,
            IssuedAt = clock.UtcNow,
            VerificationSlug = certificateId.ToLowerInvariant(),
            VerificationUrl = $"/verify/{certificateId.ToLowerInvariant()}",
            AuthorizedSignatory = OptionalText(request.AuthorizedSignatory, 180) ?? "Joviq Technologies"
        };

        dbContext.Certificates.Add(certificate);
        dbContext.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.StudentId,
            Title = "Certificate issued",
            Body = $"Your {program.Title} certificate is ready.",
            ActionUrl = "/dashboard"
        });

        Audit("Admin.CertificateIssued", new { certificate.Id, certificate.StudentId, certificate.ProgramId, certificate.CertificateId, certificate.Type });
        await dbContext.SaveChangesAsync(cancellationToken);
        return new CertificateResponse(
            certificate.Id,
            certificate.StudentId,
            certificate.ProgramId,
            program.Title,
            certificate.Type.ToString(),
            certificate.Status.ToString(),
            certificate.CertificateId,
            certificate.IssuedAt,
            certificate.VerificationSlug,
            certificate.VerificationUrl,
            certificate.QrCodeUrl,
            certificate.AuthorizedSignatory);
    }

    public async Task<CertificateResponse> UpdateCertificateStatusAsync(
        Guid certificateId,
        UpdateCertificateStatusRequest request,
        CancellationToken cancellationToken)
    {
        var certificate = await dbContext.Certificates
            .Include(x => x.Program)
            .FirstOrDefaultAsync(x => x.Id == certificateId, cancellationToken)
            ?? throw new AppException("Certificate was not found.", 404, "certificate_not_found");

        certificate.Status = request.Status;
        Audit("Admin.CertificateStatusUpdated", new { certificate.Id, certificate.StudentId, certificate.ProgramId, certificate.CertificateId, certificate.Status });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCertificate(certificate);
    }

    public async Task<IReadOnlyList<AdminNotificationResponse>> GetAdminNotificationsAsync(CancellationToken cancellationToken)
    {
        var notifications = await dbContext.Notifications
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return await MapAdminNotificationsAsync(notifications, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminNotificationResponse>> CreateAdminNotificationAsync(
        CreateAdminNotificationRequest request,
        CancellationToken cancellationToken)
    {
        var targetUserIds = new HashSet<Guid>();

        if (request.UserId.HasValue)
        {
            if (!await dbContext.Users.AnyAsync(x => x.Id == request.UserId.Value, cancellationToken))
            {
                throw new AppException("Notification user was not found.", 404, "notification_user_not_found");
            }

            targetUserIds.Add(request.UserId.Value);
        }

        if (request.SendToAllUsers)
        {
            var allUserIds = await dbContext.Users
                .AsNoTracking()
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);
            targetUserIds.UnionWith(allUserIds);
        }

        if (request.SendToAllStudents)
        {
            targetUserIds.UnionWith(await GetUserIdsInRoleAsync("Student", cancellationToken));
        }

        if (targetUserIds.Count == 0)
        {
            throw new AppException("Choose at least one notification recipient.", 400, "notification_target_required");
        }

        var title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        var body = RequiredText(request.Body, nameof(request.Body), 5, 1000);
        var actionUrl = OptionalText(request.ActionUrl, 500);
        var notifications = targetUserIds.Select(userId => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Body = body,
            ActionUrl = actionUrl
        }).ToList();

        dbContext.Notifications.AddRange(notifications);
        Audit("Admin.NotificationCreated", new { Count = notifications.Count, title });
        await dbContext.SaveChangesAsync(cancellationToken);
        return await MapAdminNotificationsAsync(notifications, cancellationToken);
    }

    private async Task<ProgramDetailsResponse> GetProgramBySlugForAdminAsync(string slug, CancellationToken cancellationToken)
    {
        var program = await dbContext.LearningPrograms
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Plans)
            .Include(x => x.Modules.OrderBy(module => module.SortOrder))
                .ThenInclude(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                    .ThenInclude(x => x.Resources)
            .FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        return await LoadAdminProgramDetailsAsync(program, cancellationToken);
    }

    private async Task<ProgramDetailsResponse> LoadAdminProgramDetailsAsync(
        LearningProgram program,
        CancellationToken cancellationToken)
    {
        var projects = await dbContext.Projects.AsNoTracking().Where(x => x.ProgramId == program.Id).ToListAsync(cancellationToken);
        return MapProgramDetails(program, projects, new Dictionary<Guid, LessonProgress>());
    }

    private async Task<Enrollment> CreateEnrollmentEntityAsync(
        Guid studentId,
        Guid programId,
        Guid? planId,
        CancellationToken cancellationToken)
    {
        var program = await dbContext.LearningPrograms
            .Include(x => x.Plans)
            .FirstOrDefaultAsync(x => x.Id == programId, cancellationToken)
            ?? throw new AppException("Program was not found.", 404, "program_not_found");

        var plan = ResolvePlan(program, planId);
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramId = program.Id,
            Program = program,
            ProgramPlanId = plan?.Id,
            ProgramPlan = plan,
            TotalAmount = plan?.OfferPrice ?? 0,
            PaidAmount = 0,
            Status = EnrollmentStatus.Reserved,
            EnrolledAt = clock.UtcNow,
            LockedReason = "Complete payment to unlock full access."
        };

        dbContext.Enrollments.Add(enrollment);
        return enrollment;
    }

    private async Task<Enrollment?> GetCurrentEnrollmentAsync(Guid studentId, CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .Include(x => x.Program)
            .Include(x => x.ProgramPlan)
            .Where(x => x.StudentId == studentId && x.Status != EnrollmentStatus.Cancelled)
            .OrderByDescending(x => x.Status == EnrollmentStatus.Active)
            .ThenByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Enrollment> RequireEnrollmentAsync(Guid studentId, CancellationToken cancellationToken)
    {
        return await GetCurrentEnrollmentAsync(studentId, cancellationToken)
            ?? throw new AppException("Student is not enrolled in a program yet.", 404, "enrollment_not_found");
    }

    private async Task<LearningProgress> GetLearningProgressAsync(
        Guid studentId,
        Guid programId,
        CancellationToken cancellationToken)
    {
        var lessonIds = await dbContext.Lessons
            .AsNoTracking()
            .Where(x => x.Module != null && x.Module.ProgramId == programId)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (lessonIds.Count == 0)
        {
            return new LearningProgress(0, 0, 0);
        }

        var completed = await dbContext.LessonProgress
            .AsNoTracking()
            .CountAsync(x => x.StudentId == studentId && lessonIds.Contains(x.LessonId) && x.IsCompleted, cancellationToken);

        return new LearningProgress(completed, lessonIds.Count, (int)Math.Round(completed / (double)lessonIds.Count * 100));
    }

    private static ProgramPlan? ResolvePlan(LearningProgram program, Guid? planId)
    {
        if (planId.HasValue)
        {
            return program.Plans.FirstOrDefault(x => x.Id == planId && x.IsActive)
                ?? throw new AppException("Program plan was not found.", 404, "program_plan_not_found");
        }

        return program.Plans
            .Where(x => x.IsActive)
            .OrderBy(x => x.OfferPrice)
            .FirstOrDefault();
    }

    private static decimal CalculatePaymentAmount(Enrollment enrollment, ProgramPlan? plan, PaymentMode mode)
    {
        var total = enrollment.TotalAmount > 0 ? enrollment.TotalAmount : plan?.OfferPrice ?? 0;
        var reserveAmount = plan?.ReserveAmount > 0 ? plan.ReserveAmount : Math.Min(999, total);

        var amount = mode switch
        {
            PaymentMode.ReserveSeat => reserveAmount,
            PaymentMode.PayInFull => Math.Max(total - enrollment.PaidAmount, 0),
            PaymentMode.RemainingBalance => Math.Max(total - enrollment.PaidAmount, 0),
            _ => throw new AppException("Invalid payment mode.", 400, "invalid_payment_mode")
        };

        if (amount <= 0)
        {
            throw new AppException("No payable amount is pending.", 400, "no_payment_due");
        }

        return amount;
    }

    private static ProgramSummaryResponse MapProgramSummary(LearningProgram program)
    {
        var startingPrice = program.Plans
            .Where(x => x.IsActive)
            .Select(x => x.OfferPrice)
            .DefaultIfEmpty(0)
            .Min();

        return new ProgramSummaryResponse(
            program.Id,
            program.CategoryId,
            program.Category?.Name ?? "Program",
            program.Slug,
            program.Title,
            program.ShortDescription,
            program.Level,
            program.Duration,
            program.LearningMode,
            ResolveProgramThumbnailUrl(program.ThumbnailUrl),
            program.Status.ToString(),
            startingPrice,
            DeserializeList(program.SkillsJson));
    }

    private static ProgramDetailsResponse MapProgramDetails(
        LearningProgram program,
        IReadOnlyList<Project> projects,
        IReadOnlyDictionary<Guid, LessonProgress> progress)
    {
        return new ProgramDetailsResponse(
            program.Id,
            program.CategoryId,
            program.Category?.Name ?? "Program",
            program.Slug,
            program.Title,
            program.ShortDescription,
            program.Overview,
            program.Level,
            program.Duration,
            program.LearningMode,
            program.CertificationName,
            ResolveProgramThumbnailUrl(program.ThumbnailUrl),
            program.Status.ToString(),
            DeserializeList(program.SkillsJson),
            DeserializeList(program.OutcomesJson),
            DeserializeFaqs(program.FaqsJson),
            program.Plans.OrderBy(x => x.SortOrder).Select(MapPlan).ToList(),
            program.Modules.OrderBy(x => x.SortOrder).Select(module => MapCurriculumModule(module, null, progress)).ToList(),
            projects.Select(project => MapProject(project, null)).ToList());
    }

    private static ProgramPlanResponse MapPlan(ProgramPlan plan)
    {
        return new ProgramPlanResponse(
            plan.Id,
            plan.ProgramId,
            plan.Name,
            plan.Code,
            plan.ActualPrice,
            plan.OfferPrice,
            plan.ReserveAmount,
            DeserializeList(plan.FeaturesJson),
            plan.IsActive);
    }

    private static CurriculumModuleResponse MapCurriculumModule(
        CurriculumModule module,
        Enrollment? enrollment,
        IReadOnlyDictionary<Guid, LessonProgress> progress)
    {
        return new CurriculumModuleResponse(
            module.Id,
            module.ProgramId,
            module.Title,
            module.Description,
            module.SortOrder,
            module.Lessons
                .OrderBy(x => x.SortOrder)
                .Select(lesson => MapLesson(lesson, enrollment, progress.GetValueOrDefault(lesson.Id)))
                .ToList());
    }

    private static LessonResponse MapLesson(Lesson lesson, Enrollment? enrollment, LessonProgress? progress)
    {
        var isLocked = enrollment?.Status == EnrollmentStatus.Reserved && lesson.AccessLevel == ContentAccessLevel.Full;
        return new LessonResponse(
            lesson.Id,
            lesson.ModuleId,
            lesson.Title,
            lesson.Summary,
            isLocked ? null : lesson.VideoUrl,
            isLocked ? null : lesson.NotesUrl,
            lesson.DurationMinutes,
            lesson.AccessLevel.ToString(),
            isLocked,
            progress?.ProgressPercentage ?? 0,
            progress?.IsCompleted ?? false,
            lesson.Resources.Select(resource => new LessonResourceResponse(
                resource.Id,
                resource.Title,
                resource.ResourceType,
                isLocked ? string.Empty : resource.Url)).ToList());
    }

    private static EnrollmentResponse MapEnrollment(Enrollment enrollment)
    {
        return new EnrollmentResponse(
            enrollment.Id,
            enrollment.StudentId,
            enrollment.ProgramId,
            enrollment.Program?.Title ?? "Program",
            enrollment.ProgramPlanId,
            enrollment.ProgramPlan?.Name,
            enrollment.Status.ToString(),
            enrollment.TotalAmount,
            enrollment.PaidAmount,
            Math.Max(enrollment.TotalAmount - enrollment.PaidAmount, 0),
            enrollment.EnrolledAt,
            enrollment.FullAccessUnlockedAt,
            enrollment.LockedReason);
    }

    private static PaymentTransactionResponse MapPayment(PaymentTransaction payment)
    {
        return new PaymentTransactionResponse(
            payment.Id,
            payment.EnrollmentId,
            payment.ProgramId,
            payment.ProgramPlanId,
            payment.Gateway,
            payment.GatewayOrderId,
            payment.GatewayPaymentId,
            payment.Mode.ToString(),
            payment.Status.ToString(),
            payment.Amount,
            payment.Currency,
            payment.CreatedAt,
            payment.VerifiedAt);
    }

    private static ProjectResponse MapProject(Project project, ProjectSubmission? submission)
    {
        return new ProjectResponse(
            project.Id,
            project.ProgramId,
            project.Title,
            project.Description,
            DeserializeList(project.RequiredArtifactsJson),
            project.MaxScore,
            project.IsPublished,
            submission is null ? null : MapProjectSubmission(submission));
    }

    private static SubmissionResponse MapProjectSubmission(ProjectSubmission submission)
    {
        return new SubmissionResponse(
            submission.Id,
            submission.ProjectId,
            "Project",
            submission.Status.ToString(),
            submission.Score,
            submission.Feedback,
            null,
            null,
            submission.GitHubUrl,
            submission.DemoUrl,
            submission.DocumentationUrl,
            submission.PresentationUrl,
            submission.Notes,
            submission.CreatedAt,
            submission.ReviewedAt);
    }

    private static CertificateResponse MapCertificate(Certificate certificate)
    {
        return new CertificateResponse(
            certificate.Id,
            certificate.StudentId,
            certificate.ProgramId,
            certificate.Program?.Title ?? "Program",
            certificate.Type.ToString(),
            certificate.Status.ToString(),
            certificate.CertificateId,
            certificate.IssuedAt,
            certificate.VerificationSlug,
            certificate.VerificationUrl,
            certificate.QrCodeUrl,
            certificate.AuthorizedSignatory);
    }

    private static NotificationResponse MapNotification(Notification notification)
    {
        return new NotificationResponse(
            notification.Id,
            notification.Title,
            notification.Body,
            notification.ActionUrl,
            notification.Status.ToString(),
            notification.CreatedAt,
            notification.ReadAt);
    }

    private static CouponResponse MapCoupon(Coupon coupon)
    {
        return new CouponResponse(
            coupon.Id,
            coupon.Code,
            coupon.Description,
            coupon.DiscountValue,
            coupon.IsPercentage,
            coupon.IsActive,
            coupon.StartsAt,
            coupon.ExpiresAt);
    }

    private async Task<IReadOnlyList<AdminNotificationResponse>> MapAdminNotificationsAsync(
        IReadOnlyList<Notification> notifications,
        CancellationToken cancellationToken)
    {
        var userIds = notifications.Select(x => x.UserId).Distinct().ToList();
        var users = await dbContext.Users
            .AsNoTracking()
            .Where(x => userIds.Contains(x.Id))
            .Select(x => new { x.Id, x.FullName, x.Email })
            .ToDictionaryAsync(x => x.Id, x => x, cancellationToken);

        return notifications.Select(notification =>
        {
            users.TryGetValue(notification.UserId, out var user);
            return new AdminNotificationResponse(
                notification.Id,
                notification.UserId,
                user?.FullName,
                user?.Email,
                notification.Title,
                notification.Body,
                notification.ActionUrl,
                notification.Status.ToString(),
                notification.CreatedAt,
                notification.ReadAt);
        }).ToList();
    }

    private async Task<IReadOnlyList<Guid>> GetUserIdsInRoleAsync(string roleName, CancellationToken cancellationToken)
    {
        var roleId = await dbContext.Roles
            .AsNoTracking()
            .Where(x => x.Name == roleName)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!roleId.HasValue)
        {
            return [];
        }

        return await dbContext.UserRoles
            .AsNoTracking()
            .Where(x => x.RoleId == roleId.Value)
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);
    }

    private static void AddDefaultProgramPlans(LearningProgram program)
    {
        var plans = new[]
        {
            new
            {
                Name = "Self-Paced",
                Code = "SELF",
                ActualPrice = 7999m,
                OfferPrice = 3999m,
                Features = new[]
                {
                    "Lesson Replays", "Complete Curriculum", "Projects", "LMS Access",
                    "Certificate", "Basic Support"
                }
            },
            new
            {
                Name = "Intermediate",
                Code = "INTERMEDIATE",
                ActualPrice = 9999m,
                OfferPrice = 4999m,
                Features = new[]
                {
                    "Live Sessions", "Project Reviews", "Resume Review",
                    "Interview Preparation", "Priority Support"
                }
            },
            new
            {
                Name = "Master",
                Code = "MASTER",
                ActualPrice = 14999m,
                OfferPrice = 9999m,
                Features = new[]
                {
                    "Additional Live Sessions", "Advanced Project Reviews", "Portfolio Development",
                    "Resume Optimization", "Mock Interviews", "Technical Interview Preparation", "HR Interview Preparation",
                    "Career / Placement Assistance", "Priority Support"
                }
            }
        };

        for (var index = 0; index < plans.Length; index++)
        {
            var plan = plans[index];
            program.Plans.Add(new ProgramPlan
            {
                Id = Guid.NewGuid(),
                ProgramId = program.Id,
                Program = program,
                Name = plan.Name,
                Code = plan.Code,
                ActualPrice = plan.ActualPrice,
                OfferPrice = plan.OfferPrice,
                ReserveAmount = 999m,
                FeaturesJson = SerializeList(plan.Features),
                IsActive = true,
                SortOrder = index + 1
            });
        }
    }

    private static void ApplyProgramRequest(LearningProgram program, CreateProgramRequest request)
    {
        program.CategoryId = request.CategoryId;
        program.Slug = NormalizeSlug(request.Slug);
        program.Title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        program.ShortDescription = RequiredText(request.ShortDescription, nameof(request.ShortDescription), 10, 600);
        program.Overview = RequiredText(request.Overview, nameof(request.Overview), 20, 4000);
        program.Level = RequiredText(request.Level, nameof(request.Level), 2, 80);
        program.Duration = RequiredText(request.Duration, nameof(request.Duration), 2, 80);
        program.LearningMode = RequiredText(request.LearningMode, nameof(request.LearningMode), 2, 120);
        program.CertificationName = RequiredText(request.CertificationName, nameof(request.CertificationName), 2, 180);
        program.ThumbnailUrl = OptionalMediaUrl(request.ThumbnailUrl, nameof(request.ThumbnailUrl));
        program.SkillsJson = SerializeList(request.Skills);
        program.OutcomesJson = SerializeList(request.Outcomes);
        program.FaqsJson = JsonSerializer.Serialize(request.Faqs, JsonOptions);
        program.Status = request.Status;
    }

    private static void ApplyProgramRequest(LearningProgram program, UpdateProgramRequest request)
    {
        ApplyProgramRequest(program, new CreateProgramRequest
        {
            CategoryId = request.CategoryId,
            Slug = request.Slug,
            Title = request.Title,
            ShortDescription = request.ShortDescription,
            Overview = request.Overview,
            Level = request.Level,
            Duration = request.Duration,
            LearningMode = request.LearningMode,
            CertificationName = request.CertificationName,
            ThumbnailUrl = request.ThumbnailUrl,
            Skills = request.Skills,
            Outcomes = request.Outcomes,
            Faqs = request.Faqs,
            Status = request.Status
        });
    }

    private async Task EnsureCategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        if (!await dbContext.LearningProgramCategories.AnyAsync(x => x.Id == categoryId, cancellationToken))
        {
            throw new AppException("Program category was not found.", 404, "program_category_not_found");
        }
    }

    private async Task EnsureProgramExistsAsync(Guid programId, CancellationToken cancellationToken)
    {
        if (!await dbContext.LearningPrograms.AnyAsync(x => x.Id == programId, cancellationToken))
        {
            throw new AppException("Program was not found.", 404, "program_not_found");
        }
    }

    private static string NormalizeSlug(string value)
    {
        var slug = RequiredText(value, nameof(value), 2, 160).ToLowerInvariant();
        if (!SlugRegex.IsMatch(slug))
        {
            throw Validation("Slug", "Slug must contain lowercase letters, numbers, and single hyphens only.");
        }

        return slug;
    }

    private static string GenerateSlug(string value)
    {
        var slug = Regex.Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return NormalizeSlug(slug);
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

    private static string ValidateEmail(string value, string fieldName)
    {
        var trimmed = RequiredText(value, fieldName, 5, 256).ToLowerInvariant();
        try
        {
            _ = new MailAddress(trimmed);
            return trimmed;
        }
        catch (FormatException)
        {
            throw Validation(fieldName, "Enter a valid email address.");
        }
    }

    private static string NormalizeIndianPhone(string value)
    {
        return IndianMobileNumber.Normalize(value)
            ?? throw Validation(nameof(value), "Mobile number must be a valid India +91 number with exactly 10 digits.");
    }

    private static string? OptionalUrl(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
            (uri.Scheme is not "http" and not "https") ||
            string.IsNullOrWhiteSpace(uri.Host) ||
            (!uri.Host.Contains('.') && !uri.IsLoopback))
        {
            throw Validation(fieldName, "Enter a valid URL.");
        }

        return trimmed;
    }

    private static string? OptionalMediaUrl(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        var permanentLocalAssetUrl = ToPermanentLocalPublicAssetUrl(trimmed);
        if (!string.IsNullOrWhiteSpace(permanentLocalAssetUrl))
        {
            return permanentLocalAssetUrl;
        }

        if (IsSafeAppMediaPath(trimmed))
        {
            return trimmed;
        }

        return OptionalUrl(trimmed, fieldName);
    }

    private static bool IsSafeAppMediaPath(string value)
    {
        if (!value.StartsWith('/') ||
            value.StartsWith("//") ||
            value.Contains('\\'))
        {
            return false;
        }

        var queryStart = value.IndexOf('?');
        var path = queryStart >= 0 ? value[..queryStart] : value;
        return !path.Contains("..", StringComparison.Ordinal) &&
            (path.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase) ||
             path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase) ||
             path.StartsWith("/api/v1/assets/public-files/", StringComparison.OrdinalIgnoreCase) ||
             path.StartsWith("/api/v1/assets/local-files/", StringComparison.OrdinalIgnoreCase));
    }

    private static string ResolveProgramThumbnailUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return DefaultThumbnailUrl;
        }

        var trimmed = value.Trim();
        return ToPermanentLocalPublicAssetUrl(trimmed) ?? trimmed;
    }

    private static string? ToPermanentLocalPublicAssetUrl(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        var path = trimmed;
        string? origin = null;

        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
            origin = absoluteUri.GetLeftPart(UriPartial.Authority);
        }
        else
        {
            var queryStart = path.IndexOf('?');
            if (queryStart >= 0)
            {
                path = path[..queryStart];
            }
        }

        var match = LocalAssetFilePathRegex.Match(path);
        if (!match.Success || !Guid.TryParse(match.Groups[1].Value, out var assetId))
        {
            return null;
        }

        var publicPath = $"/api/v1/assets/public-files/{assetId:D}";
        return origin is null ? publicPath : $"{origin}{publicPath}";
    }

    private static string? OptionalJson(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        try
        {
            using var _ = JsonDocument.Parse(trimmed);
            return trimmed;
        }
        catch (JsonException)
        {
            throw Validation(fieldName, "Enter valid JSON.");
        }
    }

    private static void EnsureMoney(decimal value, string fieldName)
    {
        if (value < 0)
        {
            throw Validation(fieldName, $"{fieldName} cannot be negative.");
        }
    }

    private static void EnsureScore(decimal value, string fieldName)
    {
        if (value is < 0 or > 100)
        {
            throw Validation(fieldName, $"{fieldName} must be between 0 and 100.");
        }
    }

    private static ValidationAppException Validation(string fieldName, string message)
    {
        return new ValidationAppException(new Dictionary<string, string[]>
        {
            [fieldName] = [message]
        });
    }

    private static bool AllBlank(params string?[] values)
    {
        return values.All(string.IsNullOrWhiteSpace);
    }

    private static string SerializeList(IEnumerable<string> values)
    {
        var normalized = values
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return JsonSerializer.Serialize(normalized, JsonOptions);
    }

    private static IReadOnlyList<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<string>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static IReadOnlyList<FaqItemResponse> DeserializeFaqs(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<FaqItemResponse>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private sealed record LearningProgress(int Completed, int Total, int Percentage);
}
