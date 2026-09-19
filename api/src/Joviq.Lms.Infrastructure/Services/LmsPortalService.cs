using System.Net.Mail;
using System.Text.Json;
using System.Text.RegularExpressions;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Common.Validation;
using Joviq.Lms.Application.Lms;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class LmsPortalService(
    ApplicationDbContext dbContext,
    IDateTimeProvider clock,
    IAuditLogService auditLog,
    ICurrentUserService currentUser,
    IPaymentGateway paymentGateway,
    IOptions<PaymentOptions> paymentOptions) : ILmsPortalService
{
    private const string DefaultThumbnailUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=82";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);
    private static readonly Regex LocalAssetFilePathRegex = new(
        "/api/v1/assets/local-files/([0-9a-fA-F-]{36})",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly IReadOnlyDictionary<string, FixedPlanPricing> FixedPlans =
        new Dictionary<string, FixedPlanPricing>(StringComparer.OrdinalIgnoreCase)
        {
            ["SELF"] = new("Launch", 8000m, 1500m),
            ["INTERMEDIATE"] = new("Elevate", 10000m, 1500m),
            ["MASTER"] = new("Mastery", 15000m, 3000m)
        };

    private PaymentOptions Payments => paymentOptions.Value;

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

        return MapProgramDetails(program, projects, new Dictionary<Guid, LessonProgress>(), includeInactive: false);
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
        var hasFullAccess = HasFullAccess(enrollment, clock.UtcNow);
        var projects = hasFullAccess
            ? await GetStudentProjectsAsync(studentId, cancellationToken)
            : [];
        var certificates = hasFullAccess
            ? await GetStudentCertificatesAsync(studentId, cancellationToken)
            : [];
        var isExpired = IsAccessExpired(enrollment, clock.UtcNow);
        var programStatus = isExpired
            ? "Access expired"
            : hasFullAccess
                ? "Active"
                : enrollment.PaidAmount > 0
                    ? "Preview access"
                    : "Payment required";
        var balanceDue = isExpired && enrollment.ProgramPlan is not null
            ? GetFixedPricing(enrollment.ProgramPlan).ReserveAmount
            : Math.Max(enrollment.TotalAmount - enrollment.PaidAmount, 0);

        return new StudentLmsDashboardResponse(
            MapEnrollment(enrollment),
            programStatus,
            progress.Percentage,
            progress.Completed,
            progress.Total,
            projects.Count(x => x.LatestSubmission is null || x.LatestSubmission.Status is "Draft" or "NeedsRevision"),
            certificates.OrderByDescending(x => x.IssuedAt ?? DateTimeOffset.MinValue).FirstOrDefault(),
            balanceDue,
            notifications.Take(5).ToList());
    }

    public async Task<StudentProgramWorkspaceResponse> GetStudentWorkspaceAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var enrollment = await GetCurrentEnrollmentAsync(studentId, cancellationToken);

        return new StudentProgramWorkspaceResponse(
            enrollment is null ? null : MapEnrollment(enrollment),
            enrollment is null || !HasFullAccess(enrollment, clock.UtcNow) ? [] : await GetStudentProjectsAsync(studentId, cancellationToken),
            enrollment is null || !HasFullAccess(enrollment, clock.UtcNow) ? [] : await GetStudentCertificatesAsync(studentId, cancellationToken),
            await GetStudentPaymentsAsync(studentId, cancellationToken));
    }

    public async Task<StudentMyProgramsResponse> GetStudentMyProgramsAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var enrollments = await dbContext.Enrollments
            .AsNoTracking()
            .Include(x => x.Program)
                .ThenInclude(x => x!.Category)
            .Include(x => x.ProgramPlan)
            .Where(x => x.StudentId == studentId && x.Status != EnrollmentStatus.Cancelled)
            .OrderByDescending(x => x.Status == EnrollmentStatus.Active)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        if (enrollments.Count == 0)
        {
            return new StudentMyProgramsResponse([]);
        }

        var programIds = enrollments.Select(x => x.ProgramId).Distinct().ToList();
        var programs = await dbContext.LearningPrograms
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Plans)
            .Include(x => x.Modules.OrderBy(module => module.SortOrder))
                .ThenInclude(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                    .ThenInclude(x => x.Resources)
            .Where(x => programIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        var lessonIds = programs
            .SelectMany(program => program.Modules)
            .Where(module => module.IsActive)
            .SelectMany(module => module.Lessons.Where(lesson => lesson.IsActive))
            .Select(lesson => lesson.Id)
            .Distinct()
            .ToList();
        var progress = lessonIds.Count == 0
            ? new Dictionary<Guid, LessonProgress>()
            : await dbContext.LessonProgress
                .AsNoTracking()
                .Where(x => x.StudentId == studentId && lessonIds.Contains(x.LessonId))
                .ToDictionaryAsync(x => x.LessonId, cancellationToken);

        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(x => programIds.Contains(x.ProgramId) && x.IsPublished &&
                (!dbContext.ProjectAssignments.Any(assignment => assignment.ProjectId == x.Id) ||
                 dbContext.ProjectAssignments.Any(assignment => assignment.ProjectId == x.Id && assignment.StudentId == studentId)))
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var certificatesByProgram = (await dbContext.Certificates
                .AsNoTracking()
                .Include(x => x.Program)
                .Where(x => x.StudentId == studentId && programIds.Contains(x.ProgramId))
                .OrderByDescending(x => x.IssuedAt ?? x.CreatedAt)
                .ToListAsync(cancellationToken))
            .Select(MapCertificate)
            .GroupBy(certificate => certificate.ProgramId)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<CertificateResponse>)group.ToList());

        var programsById = programs.ToDictionary(x => x.Id);
        var result = new List<StudentEnrolledProgramResponse>(enrollments.Count);
        foreach (var enrollment in enrollments)
        {
            if (!programsById.TryGetValue(enrollment.ProgramId, out var program))
            {
                continue;
            }

            var activeLessons = program.Modules
                .Where(module => module.IsActive)
                .SelectMany(module => module.Lessons.Where(lesson => lesson.IsActive))
                .ToList();
            var completedLessons = activeLessons.Count(lesson =>
                progress.TryGetValue(lesson.Id, out var lessonProgress) && lessonProgress.IsCompleted);
            var totalLessons = activeLessons.Count;
            var programProgress = activeLessons
                .Select(lesson => lesson.Id)
                .Where(progress.ContainsKey)
                .ToDictionary(lessonId => lessonId, lessonId => progress[lessonId]);
            var programProjects = HasFullAccess(enrollment, clock.UtcNow)
                ? projects.Where(project => project.ProgramId == program.Id).ToList()
                : [];

            result.Add(new StudentEnrolledProgramResponse(
                MapEnrollment(enrollment),
                MapProgramDetails(program, programProjects, programProgress, includeInactive: false, enrollment),
                completedLessons,
                totalLessons,
                totalLessons == 0 ? 0 : (int)Math.Round(completedLessons / (double)totalLessons * 100),
                certificatesByProgram.TryGetValue(program.Id, out var certificates) ? certificates : []));
        }

        return new StudentMyProgramsResponse(result);
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

        var lessonIds = program.Modules
            .Where(module => module.IsActive)
            .SelectMany(module => module.Lessons.Where(lesson => lesson.IsActive))
            .Select(x => x.Id)
            .ToList();
        var progress = await dbContext.LessonProgress
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && lessonIds.Contains(x.LessonId))
            .ToDictionaryAsync(x => x.LessonId, cancellationToken);
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(x => x.ProgramId == program.Id && x.IsPublished &&
                (!dbContext.ProjectAssignments.Any(assignment => assignment.ProjectId == x.Id) ||
                 dbContext.ProjectAssignments.Any(assignment => assignment.ProjectId == x.Id && assignment.StudentId == studentId)))
            .ToListAsync(cancellationToken);
        return MapProgramDetails(
            program,
            HasFullAccess(enrollment, clock.UtcNow) ? projects : [],
            progress,
            includeInactive: false,
            enrollment);
    }

    public async Task<EnrollmentResponse> CreateEnrollmentAsync(
        Guid studentId,
        CreateEnrollmentRequest request,
        CancellationToken cancellationToken)
    {
        var requestedStartDate = NormalizeStartDate(request.StartDate);
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
            if (requestedStartDate.HasValue && existing.PaidAmount <= 0 && existing.StartDate != requestedStartDate)
            {
                existing.StartDate = requestedStartDate;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            return MapEnrollment(existing);
        }

        var plan = ResolvePlan(program, request.ProgramPlanId)
            ?? throw new AppException("A valid program plan is required.", 400, "program_plan_required");
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramId = program.Id,
            ProgramPlanId = plan.Id,
            Status = EnrollmentStatus.Reserved,
            TotalAmount = GetFixedPricing(plan).TotalAmount,
            PaidAmount = 0,
            EnrolledAt = clock.UtcNow,
            StartDate = requestedStartDate,
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

        Audit("Student.EnrollmentCreated", new { studentId, enrollment.Id, programId = program.Id, planId = plan.Id });
        await dbContext.SaveChangesAsync(cancellationToken);
        enrollment.Program = program;
        enrollment.ProgramPlan = plan;
        return MapEnrollment(enrollment);
    }

    public async Task<PaymentCheckoutResponse> CreatePaymentCheckoutAsync(
        Guid studentId,
        CreatePaymentCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var enrollment = await FindPaymentEnrollmentAsync(studentId, request.EnrollmentId, request.ProgramId, cancellationToken);

        if (enrollment is null)
        {
            enrollment = await CreateEnrollmentEntityAsync(studentId, request.ProgramId, request.ProgramPlanId, cancellationToken);
        }

        var plan = enrollment.ProgramPlan;
        if (plan is null && request.ProgramPlanId.HasValue)
        {
            plan = await dbContext.ProgramPlans.FirstOrDefaultAsync(
                x => x.Id == request.ProgramPlanId && x.ProgramId == enrollment.ProgramId && x.IsActive,
                cancellationToken);
        }

        if (plan is null)
        {
            throw new AppException("A valid plan is required before payment.", 400, "program_plan_required");
        }

        var pricing = GetFixedPricing(plan);
        enrollment.TotalAmount = pricing.TotalAmount;
        enrollment.ProgramPlanId = plan.Id;
        enrollment.ProgramPlan = plan;
        var originalAmount = CalculatePaymentAmount(enrollment, plan, request.Mode, clock.UtcNow);
        CouponEvaluation? couponEvaluation = null;
        Coupon? coupon = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            coupon = await FindCouponAsync(request.CouponCode, cancellationToken);
            var studentEmail = await GetStudentEmailAsync(studentId, cancellationToken);
            couponEvaluation = await EvaluateCouponAsync(
                coupon,
                studentId,
                studentEmail,
                enrollment,
                originalAmount,
                request.Mode,
                clock.UtcNow,
                cancellationToken);
        }

        var amount = couponEvaluation?.PayableAmount ?? originalAmount;
        var checkoutExpiresAt = clock.UtcNow.AddMinutes(Math.Clamp(Payments.CheckoutExpiryMinutes, 5, 30));
        var transaction = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            EnrollmentId = enrollment.Id,
            ProgramId = enrollment.ProgramId,
            ProgramPlanId = enrollment.ProgramPlanId,
            Gateway = Payments.Provider,
            GatewayOrderId = $"pending_{Guid.NewGuid():N}",
            Mode = request.Mode,
            Status = PaymentStatus.Pending,
            Amount = amount,
            OriginalAmount = originalAmount,
            DiscountAmount = couponEvaluation?.DiscountAmount ?? 0,
            CouponId = coupon?.Id,
            CouponCode = coupon?.Code,
            Currency = Payments.Currency,
            CheckoutExpiresAt = checkoutExpiresAt
        };

        dbContext.PaymentTransactions.Add(transaction);
        CouponRedemption? redemption = null;
        if (coupon is not null && couponEvaluation is not null)
        {
            redemption = new CouponRedemption
            {
                Id = Guid.NewGuid(),
                CouponId = coupon.Id,
                StudentId = studentId,
                EnrollmentId = enrollment.Id,
                PaymentTransactionId = transaction.Id,
                Status = CouponRedemptionStatus.Reserved,
                OriginalAmount = originalAmount,
                DiscountAmount = couponEvaluation.DiscountAmount,
                FinalAmount = amount,
                ExpiresAt = checkoutExpiresAt
            };
            dbContext.CouponRedemptions.Add(redemption);
        }
        Audit("Student.PaymentCheckoutCreated", new { studentId, transaction.Id, transaction.EnrollmentId, transaction.ProgramId, transaction.Mode, transaction.Amount });
        await dbContext.SaveChangesAsync(cancellationToken);

        if (amount == 0)
        {
            transaction.Gateway = "Free";
            transaction.GatewayOrderId = $"free_{transaction.Id:N}";
            await dbContext.SaveChangesAsync(cancellationToken);
            return new PaymentCheckoutResponse(
                MapPayment(transaction),
                "Free",
                string.Empty,
                transaction.GatewayOrderId,
                0,
                transaction.Currency,
                checkoutExpiresAt);
        }

        try
        {
            var gatewayOrder = await paymentGateway.CreateOrderAsync(
                transaction.Id,
                transaction.Amount,
                transaction.Currency,
                checkoutExpiresAt,
                request.CustomerName,
                request.CustomerEmail,
                request.CustomerPhone,
                request.CustomerCollege,
                cancellationToken);
            transaction.Gateway = gatewayOrder.Provider;
            transaction.GatewayOrderId = gatewayOrder.OrderId;
            transaction.CheckoutExpiresAt = gatewayOrder.ExpiresAt;
            await dbContext.SaveChangesAsync(cancellationToken);

            return new PaymentCheckoutResponse(
                MapPayment(transaction),
                gatewayOrder.Provider,
                gatewayOrder.PublicKey,
                gatewayOrder.OrderId,
                gatewayOrder.AmountInMinorUnits,
                gatewayOrder.Currency,
                gatewayOrder.ExpiresAt,
                gatewayOrder.PaymentSessionId,
                gatewayOrder.Environment);
        }
        catch (AppException exception)
        {
            transaction.Status = PaymentStatus.Failed;
            transaction.FailureReason = OptionalText(exception.Message, 500);
            if (redemption is not null)
            {
                redemption.Status = CouponRedemptionStatus.Released;
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            throw;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            transaction.Status = PaymentStatus.Failed;
            transaction.FailureReason = "Payment gateway request failed.";
            if (redemption is not null)
            {
                redemption.Status = CouponRedemptionStatus.Released;
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("The payment gateway is temporarily unavailable. Please try again.", 503, "payment_gateway_unavailable");
        }
    }

    public async Task<CouponValidationResponse> ValidateCouponAsync(
        Guid studentId,
        ValidateCouponRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Mode != PaymentMode.RemainingBalance)
        {
            throw new AppException("Coupons can only be used on the remaining balance. The initial reserve payment is never discounted.", 400, "coupon_remaining_only");
        }

        var enrollment = await FindPaymentEnrollmentAsync(studentId, request.EnrollmentId, request.ProgramId, cancellationToken)
            ?? throw new AppException("Complete the initial payment before applying a coupon to the remaining balance.", 400, "initial_payment_required");
        var plan = enrollment.ProgramPlan;
        if (plan is null && request.ProgramPlanId.HasValue)
        {
            plan = await dbContext.ProgramPlans.FirstOrDefaultAsync(
                x => x.Id == request.ProgramPlanId && x.ProgramId == enrollment.ProgramId && x.IsActive,
                cancellationToken);
        }

        if (plan is null)
        {
            throw new AppException("A valid plan is required before applying a coupon.", 400, "program_plan_required");
        }

        var originalAmount = CalculatePaymentAmount(enrollment, plan, request.Mode, clock.UtcNow);
        var coupon = await FindCouponAsync(request.CouponCode, cancellationToken);
        var studentEmail = await GetStudentEmailAsync(studentId, cancellationToken);
        var evaluation = await EvaluateCouponAsync(
            coupon,
            studentId,
            studentEmail,
            enrollment,
            originalAmount,
            request.Mode,
            clock.UtcNow,
            cancellationToken);
        return new CouponValidationResponse(
            evaluation.Code,
            evaluation.Description,
            evaluation.OriginalAmount,
            evaluation.DiscountAmount,
            evaluation.PayableAmount);
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

        var orderId = RequiredText(request.GatewayOrderId ?? string.Empty, nameof(request.GatewayOrderId), 3, 160);
        var isFreePayment = string.Equals(transaction.Gateway, "Free", StringComparison.OrdinalIgnoreCase);
        if (!string.Equals(transaction.GatewayOrderId, orderId, StringComparison.Ordinal))
        {
            throw new AppException("The payment order does not match this checkout.", 400, "payment_order_mismatch");
        }

        if (transaction.CheckoutExpiresAt.HasValue && transaction.CheckoutExpiresAt <= clock.UtcNow)
        {
            transaction.Status = PaymentStatus.Failed;
            transaction.FailureReason = "Checkout expired.";
            var expiredRedemption = await dbContext.CouponRedemptions
                .FirstOrDefaultAsync(x => x.PaymentTransactionId == transaction.Id && x.Status == CouponRedemptionStatus.Reserved, cancellationToken);
            if (expiredRedemption is not null)
            {
                expiredRedemption.Status = CouponRedemptionStatus.Released;
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new AppException("This payment session expired. Start a new payment attempt.", 400, "payment_expired");
        }

        var paymentVerification = isFreePayment
            ? new PaymentGatewayVerification(true, $"free_{transaction.Id:N}")
            : await paymentGateway.VerifyPaymentAsync(
                orderId,
                request.GatewayPaymentId,
                request.GatewaySignature,
                cancellationToken);
        if (!paymentVerification.IsValid)
        {
            throw new AppException("Payment verification failed. No access was granted.", 400, "payment_signature_invalid");
        }

        var paymentId = RequiredText(
            paymentVerification.PaymentId ?? request.GatewayPaymentId ?? string.Empty,
            nameof(request.GatewayPaymentId),
            3,
            160);

        if (await dbContext.PaymentTransactions.AnyAsync(
                x => x.GatewayPaymentId == paymentId && x.Id != transaction.Id,
                cancellationToken))
        {
            throw new AppException("This gateway payment was already processed.", 409, "payment_already_processed");
        }

        transaction.Status = PaymentStatus.Verified;
        transaction.GatewayPaymentId = paymentId;
        transaction.VerifiedAt = clock.UtcNow;
        var redemption = await dbContext.CouponRedemptions
            .FirstOrDefaultAsync(x => x.PaymentTransactionId == transaction.Id, cancellationToken);
        if (redemption is not null)
        {
            if (redemption.Status == CouponRedemptionStatus.Released || redemption.ExpiresAt <= clock.UtcNow)
            {
                throw new AppException("This coupon reservation expired. Start a new payment attempt.", 400, "coupon_reservation_expired");
            }

            redemption.Status = CouponRedemptionStatus.Redeemed;
        }
        ApplyVerifiedPayment(transaction, clock.UtcNow);
        await ActivateCheckoutAccountAsync(studentId, cancellationToken);
        if (transaction.Enrollment is not null)
        {
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

    public async Task<PaymentTransactionResponse> MarkPaymentFailedAsync(
        Guid studentId,
        Guid paymentId,
        string? failureReason,
        CancellationToken cancellationToken)
    {
        var payment = await dbContext.PaymentTransactions
            .FirstOrDefaultAsync(x => x.Id == paymentId && x.StudentId == studentId, cancellationToken)
            ?? throw new AppException("Payment transaction was not found.", 404, "payment_not_found");

        if (payment.Status == PaymentStatus.Pending)
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = OptionalText(failureReason, 500) ?? "Payment was cancelled or declined.";
            var redemption = await dbContext.CouponRedemptions
                .FirstOrDefaultAsync(x => x.PaymentTransactionId == payment.Id, cancellationToken);
            if (redemption is not null && redemption.Status == CouponRedemptionStatus.Reserved)
            {
                redemption.Status = CouponRedemptionStatus.Released;
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return MapPayment(payment);
    }

    public Task<PaymentReceiptResponse> GetPaymentReceiptAsync(
        Guid studentId,
        Guid paymentId,
        CancellationToken cancellationToken)
        => BuildPaymentReceiptAsync(paymentId, studentId, cancellationToken);

    public Task<PaymentReceiptResponse> GetAdminPaymentReceiptAsync(
        Guid paymentId,
        CancellationToken cancellationToken)
        => BuildPaymentReceiptAsync(paymentId, null, cancellationToken);

    private async Task<PaymentReceiptResponse> BuildPaymentReceiptAsync(
        Guid paymentId,
        Guid? studentId,
        CancellationToken cancellationToken)
    {
        var payment = await dbContext.PaymentTransactions
            .AsNoTracking()
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.Program)
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.ProgramPlan)
            .FirstOrDefaultAsync(x => x.Id == paymentId && (!studentId.HasValue || x.StudentId == studentId.Value), cancellationToken)
            ?? throw new AppException("Payment transaction was not found.", 404, "payment_not_found");

        if (payment.Status != PaymentStatus.Verified)
        {
            throw new AppException("A receipt is available after payment verification.", 400, "receipt_not_available");
        }

        var student = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == studentId)
            .Select(x => new { x.FullName, x.Email })
            .FirstOrDefaultAsync(cancellationToken);

        return new PaymentReceiptResponse(
            payment.Id,
            payment.InvoiceNumber ?? $"JOVIQ-{payment.Id.ToString("N")[..10].ToUpperInvariant()}",
            payment.Status.ToString(),
            student?.FullName ?? "Joviq Learner",
            student?.Email ?? string.Empty,
            payment.Enrollment?.Program?.Title ?? "Joviq Program",
            payment.Enrollment?.ProgramPlan?.Name ?? "Program plan",
            payment.Mode.ToString(),
            payment.Amount,
            payment.OriginalAmount,
            payment.DiscountAmount,
            payment.CouponCode,
            payment.Currency,
            payment.Gateway,
            payment.GatewayOrderId,
            payment.GatewayPaymentId,
            payment.VerifiedAt,
            payment.CreatedAt);
    }

    public async Task ProcessPaymentWebhookAsync(
        string payload,
        string signature,
        CancellationToken cancellationToken)
    {
        if (!paymentGateway.VerifyWebhookSignature(payload, signature))
        {
            throw new AppException("Invalid payment webhook signature.", 401, "payment_webhook_invalid");
        }

        using var document = JsonDocument.Parse(payload);
        var eventName = document.RootElement.TryGetProperty("event", out var eventElement)
            ? eventElement.GetString()
            : null;
        if (!string.Equals(eventName, "payment.captured", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!document.RootElement.TryGetProperty("payload", out var payloadElement) ||
            !payloadElement.TryGetProperty("payment", out var paymentElement) ||
            !paymentElement.TryGetProperty("entity", out var entity))
        {
            return;
        }

        var orderId = entity.TryGetProperty("order_id", out var orderElement) ? orderElement.GetString() : null;
        var paymentId = entity.TryGetProperty("id", out var paymentIdElement) ? paymentIdElement.GetString() : null;
        if (string.IsNullOrWhiteSpace(orderId) || string.IsNullOrWhiteSpace(paymentId))
        {
            return;
        }

        var transaction = await dbContext.PaymentTransactions
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.Program)
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.ProgramPlan)
            .FirstOrDefaultAsync(x => x.GatewayOrderId == orderId, cancellationToken);

        if (transaction is null || transaction.Status == PaymentStatus.Verified)
        {
            return;
        }

        if (await dbContext.PaymentTransactions.AnyAsync(
                x => x.GatewayPaymentId == paymentId && x.Id != transaction.Id,
                cancellationToken))
        {
            return;
        }

        transaction.Status = PaymentStatus.Verified;
        transaction.GatewayPaymentId = paymentId;
        transaction.VerifiedAt = clock.UtcNow;
        var redemption = await dbContext.CouponRedemptions
            .FirstOrDefaultAsync(x => x.PaymentTransactionId == transaction.Id, cancellationToken);
        if (redemption is not null)
        {
            redemption.Status = CouponRedemptionStatus.Redeemed;
        }
        ApplyVerifiedPayment(transaction, clock.UtcNow);
        await ActivateCheckoutAccountAsync(transaction.StudentId, cancellationToken);
        dbContext.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = transaction.StudentId,
            Title = "Payment verified",
            Body = $"INR {transaction.Amount:n0} payment for {transaction.Enrollment?.Program?.Title ?? "your program"} is verified.",
            ActionUrl = "/dashboard"
        });
        Audit("Student.PaymentVerifiedByWebhook", new { transaction.Id, transaction.StudentId, transaction.EnrollmentId, transaction.GatewayPaymentId });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ProcessCashfreePaymentWebhookAsync(string payload, CancellationToken cancellationToken)
    {
        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        if (!root.TryGetProperty("type", out var typeElement) ||
            !string.Equals(typeElement.GetString(), "PAYMENT_SUCCESS_WEBHOOK", StringComparison.OrdinalIgnoreCase) ||
            !root.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("order", out var order) ||
            !data.TryGetProperty("payment", out var paymentData))
        {
            return;
        }

        var orderId = order.TryGetProperty("order_id", out var orderIdElement) ? orderIdElement.GetString() : null;
        var paymentId = paymentData.TryGetProperty("cf_payment_id", out var paymentIdElement) ? paymentIdElement.GetString() : null;
        var paymentStatus = paymentData.TryGetProperty("payment_status", out var paymentStatusElement) ? paymentStatusElement.GetString() : null;
        if (string.IsNullOrWhiteSpace(orderId) || string.IsNullOrWhiteSpace(paymentId) ||
            !string.Equals(paymentStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var transaction = await dbContext.PaymentTransactions
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.Program)
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.ProgramPlan)
            .FirstOrDefaultAsync(x => x.GatewayOrderId == orderId, cancellationToken);

        if (transaction is null || transaction.Status == PaymentStatus.Verified ||
            await dbContext.PaymentTransactions.AnyAsync(x => x.GatewayPaymentId == paymentId && x.Id != transaction.Id, cancellationToken))
        {
            return;
        }

        transaction.Status = PaymentStatus.Verified;
        transaction.GatewayPaymentId = paymentId;
        transaction.VerifiedAt = clock.UtcNow;
        var redemption = await dbContext.CouponRedemptions
            .FirstOrDefaultAsync(x => x.PaymentTransactionId == transaction.Id, cancellationToken);
        if (redemption is not null)
        {
            redemption.Status = CouponRedemptionStatus.Redeemed;
        }
        ApplyVerifiedPayment(transaction, clock.UtcNow);
        await ActivateCheckoutAccountAsync(transaction.StudentId, cancellationToken);
        dbContext.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = transaction.StudentId,
            Title = "Payment verified",
            Body = $"INR {transaction.Amount:n0} payment for {transaction.Enrollment?.Program?.Title ?? "your program"} is verified.",
            ActionUrl = "/dashboard"
        });
        Audit("Student.PaymentVerifiedByCashfreeWebhook", new { transaction.Id, transaction.StudentId, transaction.EnrollmentId, transaction.GatewayPaymentId });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProjectResponse>> GetStudentProjectsAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var enrollment = await RequireEnrollmentAsync(studentId, cancellationToken);
        EnsureFullAccess(enrollment, clock.UtcNow);
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Where(x => x.ProgramId == enrollment.ProgramId && x.IsPublished &&
                dbContext.ProjectAssignments.Any(assignment => assignment.ProjectId == x.Id && assignment.StudentId == studentId))
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
        EnsureFullAccess(enrollment, clock.UtcNow);
        var project = await dbContext.Projects
            .FirstOrDefaultAsync(x => x.Id == projectId && x.ProgramId == enrollment.ProgramId && x.IsPublished &&
                dbContext.ProjectAssignments.Any(assignment => assignment.ProjectId == x.Id && assignment.StudentId == studentId), cancellationToken)
            ?? throw new AppException("Project was not found.", 404, "project_not_found");

        if (request.FileAssetId is null && AllBlank(request.GitHubUrl, request.DemoUrl, request.DocumentationUrl, request.PresentationUrl, request.Notes))
        {
            throw Validation(nameof(request.FileAssetId), "Attach a project file, add an artifact link, or write submission notes.");
        }

        if (request.FileAssetId.HasValue)
        {
            _ = await dbContext.Assets
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.FileAssetId.Value &&
                                          x.OwnerUserId == studentId &&
                                          x.Purpose == AssetPurpose.ProjectSubmission &&
                                          x.Status == AssetStatus.Ready, cancellationToken)
                ?? throw new AppException("The submitted file is not ready or does not belong to you.", 400, "project_submission_file_invalid");
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
            FileAssetId = request.FileAssetId,
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

        return payments.Select(payment => MapPayment(payment)).ToList();
    }

    public async Task<IReadOnlyList<CertificateResponse>> GetStudentCertificatesAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var enrollment = await RequireEnrollmentAsync(studentId, cancellationToken);
        EnsureFullAccess(enrollment, clock.UtcNow);
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
        if (!FixedPlans.TryGetValue(code, out var fixedPricing))
        {
            throw new AppException("Use one of the fixed plans: Launch, Elevate, or Mastery.", 400, "invalid_program_plan");
        }
        if (program.Plans.Any(x => string.Equals(x.Code, code, StringComparison.OrdinalIgnoreCase)))
        {
            throw new AppException("Plan code already exists for this program.", 409, "plan_code_exists");
        }

        var plan = new ProgramPlan
        {
            Id = Guid.NewGuid(),
            ProgramId = program.Id,
            Name = fixedPricing.Name,
            Code = code,
            ActualPrice = fixedPricing.TotalAmount,
            OfferPrice = fixedPricing.TotalAmount,
            ReserveAmount = fixedPricing.ReserveAmount,
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

        var code = RequiredText(request.Code, nameof(request.Code), 2, 80).ToUpperInvariant();
        if (!FixedPlans.TryGetValue(code, out var fixedPricing))
        {
            throw new AppException("Use one of the fixed plans: Launch, Elevate, or Mastery.", 400, "invalid_program_plan");
        }

        plan.Name = fixedPricing.Name;
        plan.Code = code;
        plan.ActualPrice = fixedPricing.TotalAmount;
        plan.OfferPrice = fixedPricing.TotalAmount;
        plan.ReserveAmount = fixedPricing.ReserveAmount;
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

        return modules.Select(module => MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>(), includeInactive: true)).ToList();
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
            SortOrder = request.SortOrder.GetValueOrDefault() > 0
                ? request.SortOrder!.Value
                : await dbContext.CurriculumModules.CountAsync(x => x.ProgramId == programId, cancellationToken) + 1,
            IsActive = request.IsActive ?? true
        };

        dbContext.CurriculumModules.Add(module);
        Audit("Admin.CurriculumModuleCreated", new { module.Id, module.ProgramId, module.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>(), includeInactive: true);
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
        if (request.SortOrder.GetValueOrDefault() > 0)
        {
            module.SortOrder = request.SortOrder!.Value;
        }

        if (request.IsActive.HasValue)
        {
            module.IsActive = request.IsActive.Value;
        }

        Audit("Admin.CurriculumModuleUpdated", new { module.Id, module.ProgramId, module.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>(), includeInactive: true);
    }

    public async Task DeleteModuleAsync(Guid moduleId, CancellationToken cancellationToken)
    {
        var module = await dbContext.CurriculumModules
            .FirstOrDefaultAsync(x => x.Id == moduleId, cancellationToken)
            ?? throw new AppException("Curriculum module was not found.", 404, "module_not_found");

        dbContext.CurriculumModules.Remove(module);
        Audit("Admin.CurriculumModuleDeleted", new { module.Id, module.ProgramId, module.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CurriculumModuleResponse>> ReorderModulesAsync(
        Guid programId,
        ReorderItemsRequest request,
        CancellationToken cancellationToken)
    {
        var modules = await dbContext.CurriculumModules
            .Where(x => x.ProgramId == programId)
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        ApplyOrder(modules, request.OrderedIds, "module", module => module.Id, (module, order) => module.SortOrder = order);
        Audit("Admin.CurriculumModulesReordered", new { programId, request.OrderedIds });
        await dbContext.SaveChangesAsync(cancellationToken);
        return modules
            .OrderBy(x => x.SortOrder)
            .Select(module => MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>(), includeInactive: true))
            .ToList();
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
            SortOrder = request.SortOrder.GetValueOrDefault() > 0
                ? request.SortOrder!.Value
                : await dbContext.Lessons.CountAsync(x => x.ModuleId == moduleId, cancellationToken) + 1,
            IsActive = request.IsActive ?? true
        };

        foreach (var resource in MapLessonResources(request.Resources))
        {
            resource.LessonId = lesson.Id;
            resource.Lesson = lesson;
            lesson.Resources.Add(resource);
        }

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
        var lesson = await dbContext.Lessons
            .Include(x => x.Resources)
            .FirstOrDefaultAsync(x => x.Id == lessonId, cancellationToken)
            ?? throw new AppException("Lesson was not found.", 404, "lesson_not_found");

        lesson.Title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        lesson.Summary = RequiredText(request.Summary, nameof(request.Summary), 10, 1200);
        lesson.VideoUrl = OptionalUrl(request.VideoUrl, nameof(request.VideoUrl));
        lesson.NotesUrl = OptionalUrl(request.NotesUrl, nameof(request.NotesUrl));
        lesson.DurationMinutes = request.DurationMinutes <= 0 ? 45 : request.DurationMinutes;
        lesson.AccessLevel = request.AccessLevel;
        if (request.SortOrder.GetValueOrDefault() > 0)
        {
            lesson.SortOrder = request.SortOrder!.Value;
        }

        if (request.IsActive.HasValue)
        {
            lesson.IsActive = request.IsActive.Value;
        }

        dbContext.LessonResources.RemoveRange(lesson.Resources);
        lesson.Resources.Clear();
        foreach (var resource in MapLessonResources(request.Resources))
        {
            lesson.Resources.Add(resource);
        }

        Audit("Admin.LessonUpdated", new { lesson.Id, lesson.ModuleId, lesson.Title, lesson.AccessLevel });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapLesson(lesson, null, null);
    }

    public async Task DeleteLessonAsync(Guid lessonId, CancellationToken cancellationToken)
    {
        var lesson = await dbContext.Lessons
            .FirstOrDefaultAsync(x => x.Id == lessonId, cancellationToken)
            ?? throw new AppException("Lesson was not found.", 404, "lesson_not_found");

        dbContext.Lessons.Remove(lesson);
        Audit("Admin.LessonDeleted", new { lesson.Id, lesson.ModuleId, lesson.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CurriculumModuleResponse>> ReorderLessonsAsync(
        Guid moduleId,
        ReorderItemsRequest request,
        CancellationToken cancellationToken)
    {
        var module = await dbContext.CurriculumModules
            .Include(x => x.Lessons.OrderBy(lesson => lesson.SortOrder))
                .ThenInclude(x => x.Resources)
            .FirstOrDefaultAsync(x => x.Id == moduleId, cancellationToken)
            ?? throw new AppException("Curriculum module was not found.", 404, "module_not_found");

        ApplyOrder(module.Lessons.ToList(), request.OrderedIds, "lesson", lesson => lesson.Id, (lesson, order) => lesson.SortOrder = order);
        Audit("Admin.LessonsReordered", new { moduleId, request.OrderedIds });
        await dbContext.SaveChangesAsync(cancellationToken);
        return [MapCurriculumModule(module, null, new Dictionary<Guid, LessonProgress>(), includeInactive: true)];
    }

    public async Task<IReadOnlyList<ProjectResponse>> GetAdminProjectsAsync(CancellationToken cancellationToken)
    {
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Include(x => x.Assignments)
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return projects.Select(x => MapProject(x, null)).ToList();
    }

    public async Task<IReadOnlyList<ProjectSubmissionReviewResponse>> GetAdminProjectSubmissionsAsync(
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        var submissions = await dbContext.ProjectSubmissions
            .AsNoTracking()
            .Include(x => x.Project)
                .ThenInclude(x => x!.Program)
            .Where(x => projectId == null || x.ProjectId == projectId.Value)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var latestSubmissions = submissions
            .GroupBy(x => new { x.ProjectId, x.StudentId })
            .Select(group => group.First())
            .ToList();

        var studentIds = latestSubmissions.Select(x => x.StudentId).Distinct().ToList();
        var students = await dbContext.Users
            .AsNoTracking()
            .Where(x => studentIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        return latestSubmissions
            .Where(x => x.Project?.Program is not null && students.ContainsKey(x.StudentId))
            .Select(x => new ProjectSubmissionReviewResponse(
                x.Id,
                x.ProjectId,
                x.Project!.ProgramId,
                x.Project.Title,
                x.Project.Program!.Title,
                x.StudentId,
                students[x.StudentId].FullName,
                students[x.StudentId].Email ?? string.Empty,
                x.Project.MaxScore,
                MapProjectSubmission(x)))
            .ToList();
    }

    public async Task<SubmissionResponse> ReviewProjectSubmissionAsync(
        Guid submissionId,
        ReviewProjectSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Status == SubmissionStatus.Draft)
        {
            throw Validation(nameof(request.Status), "A reviewed submission cannot be moved back to draft.");
        }

        var submission = await dbContext.ProjectSubmissions
            .Include(x => x.Project)
            .FirstOrDefaultAsync(x => x.Id == submissionId, cancellationToken)
            ?? throw new AppException("Project submission was not found.", 404, "project_submission_not_found");
        var project = submission.Project
            ?? throw new AppException("The project for this submission was not found.", 404, "project_not_found");

        if (request.Score is not null && (request.Score < 0 || request.Score > project.MaxScore))
        {
            throw Validation(nameof(request.Score), $"Score must be between 0 and {project.MaxScore}.");
        }

        if (request.Status == SubmissionStatus.Approved && request.Score is null)
        {
            throw Validation(nameof(request.Score), "Add the awarded score before approving the submission.");
        }

        submission.Status = request.Status;
        submission.Score = request.Score;
        submission.Feedback = OptionalText(request.Feedback, 2500);
        submission.ReviewedById = currentUser.UserId;
        submission.ReviewedAt = clock.UtcNow;

        var approved = request.Status == SubmissionStatus.Approved;
        dbContext.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = submission.StudentId,
            Title = approved ? "Project approved" : "Project needs updates",
            Body = approved
                ? $"{project.Title} was reviewed and awarded {request.Score:0.##}/{project.MaxScore:0.##} points.{(string.IsNullOrWhiteSpace(submission.Feedback) ? string.Empty : $" Feedback: {submission.Feedback}")}"
                : $"Your review for {project.Title} needs another update.{(string.IsNullOrWhiteSpace(submission.Feedback) ? string.Empty : $" Feedback: {submission.Feedback}")}",
            ActionUrl = "/dashboard?section=Projects"
        });

        Audit("Admin.ProjectSubmissionReviewed", new
        {
            submission.Id,
            submission.ProjectId,
            submission.StudentId,
            submission.Status,
            submission.Score
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProjectSubmission(submission);
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
            UsefulLinksJson = SerializeProjectLinks(request.UsefulLinks),
            ReferenceMediaUrl = OptionalMediaUrl(request.ReferenceMediaUrl, nameof(request.ReferenceMediaUrl)),
            Deadline = request.Deadline,
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
        var project = await dbContext.Projects
            .Include(x => x.Assignments)
            .FirstOrDefaultAsync(x => x.Id == projectId, cancellationToken)
            ?? throw new AppException("Project was not found.", 404, "project_not_found");

        var programChanged = project.ProgramId != request.ProgramId;
        project.ProgramId = request.ProgramId;
        project.Title = RequiredText(request.Title, nameof(request.Title), 2, 180);
        project.Description = RequiredText(request.Description, nameof(request.Description), 10, 2500);
        project.RequiredArtifactsJson = SerializeList(request.RequiredArtifacts);
        project.UsefulLinksJson = SerializeProjectLinks(request.UsefulLinks);
        project.ReferenceMediaUrl = OptionalMediaUrl(request.ReferenceMediaUrl, nameof(request.ReferenceMediaUrl));
        project.Deadline = request.Deadline;
        project.MaxScore = request.MaxScore;
        project.IsPublished = request.IsPublished;

        if (programChanged && project.Assignments.Count > 0)
        {
            dbContext.ProjectAssignments.RemoveRange(project.Assignments);
        }

        Audit("Admin.ProjectUpdated", new { project.Id, project.ProgramId, project.Title, project.IsPublished });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProject(project, null);
    }

    public async Task DeleteProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .FirstOrDefaultAsync(x => x.Id == projectId, cancellationToken)
            ?? throw new AppException("Project was not found.", 404, "project_not_found");

        dbContext.Projects.Remove(project);
        Audit("Admin.ProjectDeleted", new { project.Id, project.ProgramId, project.Title });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProjectStudentResponse>> GetProjectStudentsAsync(
        Guid programId,
        CancellationToken cancellationToken)
    {
        await EnsureProgramExistsAsync(programId, cancellationToken);

        var candidates = await (
            from enrollment in dbContext.Enrollments.AsNoTracking()
            join student in dbContext.Users.AsNoTracking() on enrollment.StudentId equals student.Id
            where enrollment.ProgramId == programId &&
                  enrollment.Status == EnrollmentStatus.Active &&
                  student.AccountStatus == AccountStatus.Active
            select new ProjectStudentResponse(
                student.Id,
                enrollment.Id,
                student.FullName,
                student.Email ?? string.Empty,
                enrollment.ProgramId,
                enrollment.Program!.Title,
                enrollment.EnrolledAt))
            .ToListAsync(cancellationToken);

        return candidates
            .GroupBy(candidate => candidate.StudentId)
            .Select(group => group.OrderByDescending(candidate => candidate.EnrolledAt).First())
            .OrderBy(candidate => candidate.FullName)
            .ThenBy(candidate => candidate.Email)
            .ToList();
    }

    public async Task<ProjectResponse> PublishProjectAsync(
        Guid projectId,
        PublishProjectRequest request,
        CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .Include(x => x.Assignments)
            .FirstOrDefaultAsync(x => x.Id == projectId, cancellationToken)
            ?? throw new AppException("Project was not found.", 404, "project_not_found");

        var requestedStudentIds = request.StudentIds.Distinct().ToList();
        if (requestedStudentIds.Count == 0)
        {
            throw Validation(nameof(request.StudentIds), "Select at least one active student before publishing.");
        }

        var candidates = await (
            from enrollment in dbContext.Enrollments
            join student in dbContext.Users on enrollment.StudentId equals student.Id
            where enrollment.ProgramId == project.ProgramId &&
                  enrollment.Status == EnrollmentStatus.Active &&
                  student.AccountStatus == AccountStatus.Active &&
                  requestedStudentIds.Contains(student.Id)
            select new { enrollment.Id, enrollment.StudentId, enrollment.EnrolledAt })
            .ToListAsync(cancellationToken);

        var selectedCandidates = candidates
            .GroupBy(candidate => candidate.StudentId)
            .Select(group => group.OrderByDescending(candidate => candidate.EnrolledAt).First())
            .ToList();

        if (selectedCandidates.Count != requestedStudentIds.Count)
        {
            throw Validation(nameof(request.StudentIds), "Every selected student must have an active enrollment in this program.");
        }

        dbContext.ProjectAssignments.RemoveRange(project.Assignments);
        foreach (var candidate in selectedCandidates)
        {
            dbContext.ProjectAssignments.Add(new ProjectAssignment
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                StudentId = candidate.StudentId,
                EnrollmentId = candidate.Id,
                AssignedAt = clock.UtcNow
            });
        }

        project.IsPublished = true;
        Audit("Admin.ProjectPublished", new { project.Id, project.ProgramId, project.Title, StudentIds = requestedStudentIds });
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapProject(project, null, requestedStudentIds.Count);
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

        var studentIds = enrollments
            .Select(enrollment => enrollment.StudentId)
            .Distinct()
            .ToList();
        var students = await dbContext.Users
            .AsNoTracking()
            .Where(user => studentIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        return enrollments
            .Select(enrollment => students.TryGetValue(enrollment.StudentId, out var student)
                ? MapEnrollment(enrollment, student.FullName, student.Email, student.PhoneNumber)
                : MapEnrollment(enrollment))
            .ToList();
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
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.Program)
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.ProgramPlan)
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        var studentIds = payments.Select(x => x.StudentId).Distinct().ToList();
        var students = await dbContext.Users
            .AsNoTracking()
            .Where(x => studentIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        return payments
            .Select(payment => students.TryGetValue(payment.StudentId, out var student)
                ? MapPayment(payment, student.FullName, student.Email)
                : MapPayment(payment))
            .ToList();
    }

    public async Task<PaymentTransactionResponse> UpdatePaymentStatusAsync(
        Guid paymentId,
        UpdatePaymentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await dbContext.PaymentTransactions
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.Program)
            .Include(x => x.Enrollment)
                .ThenInclude(x => x!.ProgramPlan)
            .FirstOrDefaultAsync(x => x.Id == paymentId, cancellationToken)
            ?? throw new AppException("Payment was not found.", 404, "payment_not_found");

        var wasVerified = payment.Status == PaymentStatus.Verified;
        if (wasVerified && request.Status != PaymentStatus.Verified)
        {
            throw new AppException("A verified payment cannot be moved back to pending or failed.", 409, "payment_already_verified");
        }

        payment.Status = request.Status;
        payment.GatewayPaymentId = OptionalText(request.GatewayPaymentId, 160);
        payment.FailureReason = request.Status == PaymentStatus.Failed
            ? OptionalText(request.FailureReason, 500)
            : null;
        payment.VerifiedAt = request.Status == PaymentStatus.Verified ? clock.UtcNow : payment.VerifiedAt;

        if (request.Status == PaymentStatus.Verified && !wasVerified && payment.Enrollment is not null)
        {
            var redemption = await dbContext.CouponRedemptions
                .FirstOrDefaultAsync(x => x.PaymentTransactionId == payment.Id, cancellationToken);
            if (redemption is not null)
            {
                if (redemption.Status == CouponRedemptionStatus.Released || redemption.ExpiresAt <= clock.UtcNow)
                {
                    throw new AppException("This coupon reservation expired. The student must start a new payment attempt.", 400, "coupon_reservation_expired");
                }

                redemption.Status = CouponRedemptionStatus.Redeemed;
            }

            ApplyVerifiedPayment(payment, clock.UtcNow);
        }

        if (request.Status == PaymentStatus.Failed)
        {
            var redemption = await dbContext.CouponRedemptions
                .FirstOrDefaultAsync(x => x.PaymentTransactionId == payment.Id && x.Status == CouponRedemptionStatus.Reserved, cancellationToken);
            if (redemption is not null)
            {
                redemption.Status = CouponRedemptionStatus.Released;
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
        ValidateCouponRequest(request);
        await EnsureCouponTargetsExistAsync(request, cancellationToken);
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
            ExpiresAt = request.ExpiresAt,
            AudienceType = request.AudienceType,
            MinimumOrderAmount = request.MinimumOrderAmount,
            MaximumDiscountAmount = request.MaximumDiscountAmount,
            MaxRedemptions = request.MaxRedemptions,
            MaxRedemptionsPerStudent = request.MaxRedemptionsPerStudent,
            TargetStudentIdsJson = SerializeGuidList(request.TargetStudentIds),
            TargetStudentEmailsJson = SerializeList(NormalizeCouponEmails(request.TargetStudentEmails)),
            TargetProgramIdsJson = SerializeGuidList(request.TargetProgramIds),
            TargetCategoryIdsJson = SerializeGuidList(request.TargetCategoryIds)
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
        ValidateCouponRequest(request);
        await EnsureCouponTargetsExistAsync(request, cancellationToken);
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
        coupon.AudienceType = request.AudienceType;
        coupon.MinimumOrderAmount = request.MinimumOrderAmount;
        coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
        coupon.MaxRedemptions = request.MaxRedemptions;
        coupon.MaxRedemptionsPerStudent = request.MaxRedemptionsPerStudent;
        coupon.TargetStudentIdsJson = SerializeGuidList(request.TargetStudentIds);
        coupon.TargetStudentEmailsJson = SerializeList(NormalizeCouponEmails(request.TargetStudentEmails));
        coupon.TargetProgramIdsJson = SerializeGuidList(request.TargetProgramIds);
        coupon.TargetCategoryIdsJson = SerializeGuidList(request.TargetCategoryIds);

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
        var projects = await dbContext.Projects
            .AsNoTracking()
            .Include(x => x.Assignments)
            .Where(x => x.ProgramId == program.Id)
            .ToListAsync(cancellationToken);
        return MapProgramDetails(program, projects, new Dictionary<Guid, LessonProgress>(), includeInactive: true);
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

        var plan = ResolvePlan(program, planId)
            ?? throw new AppException("A valid program plan is required.", 400, "program_plan_required");
        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramId = program.Id,
            Program = program,
            ProgramPlanId = plan.Id,
            ProgramPlan = plan,
            TotalAmount = GetFixedPricing(plan).TotalAmount,
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

    private static decimal CalculatePaymentAmount(Enrollment enrollment, ProgramPlan plan, PaymentMode mode, DateTimeOffset now)
    {
        var pricing = GetFixedPricing(plan);
        var total = pricing.TotalAmount;
        var isExpired = IsAccessExpired(enrollment, now);

        if (mode == PaymentMode.ReserveSeat && !isExpired && enrollment.PaidAmount > 0)
        {
            throw new AppException("The initial payment has already been completed for this access period.", 400, "initial_payment_already_paid");
        }

        if (mode == PaymentMode.RemainingBalance && (enrollment.PaidAmount <= 0 || isExpired))
        {
            throw new AppException("Complete the compulsory initial payment before paying the remaining balance.", 400, "initial_payment_required");
        }

        var amount = mode switch
        {
            PaymentMode.ReserveSeat => pricing.ReserveAmount,
            PaymentMode.PayInFull => Math.Max(total - enrollment.PaidAmount - enrollment.DiscountAmount, 0),
            PaymentMode.RemainingBalance => Math.Max(total - enrollment.PaidAmount - enrollment.DiscountAmount, 0),
            _ => throw new AppException("Invalid payment mode.", 400, "invalid_payment_mode")
        };

        if (amount <= 0)
        {
            throw new AppException("No payable amount is pending.", 400, "no_payment_due");
        }

        return amount;
    }

    private static FixedPlanPricing GetFixedPricing(ProgramPlan plan)
    {
        return FixedPlans.TryGetValue(plan.Code, out var pricing)
            ? pricing
            : throw new AppException("Only the Launch, Elevate, and Mastery plans are available.", 400, "invalid_program_plan");
    }

    private static decimal GetPlanTotal(ProgramPlan plan)
        => GetFixedPricing(plan).TotalAmount;

    private DateOnly? NormalizeStartDate(DateOnly? startDate)
    {
        if (!startDate.HasValue)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        if (startDate.Value < today)
        {
            throw new AppException("The preferred start date cannot be in the past.", 400, "invalid_start_date");
        }

        return startDate;
    }

    private static bool IsAccessNotStarted(Enrollment enrollment, DateTimeOffset now)
        => enrollment.StartDate.HasValue && ResolveAccessStart(enrollment, now) > now;

    private static DateTimeOffset ResolveAccessStart(Enrollment enrollment, DateTimeOffset now)
    {
        if (!enrollment.StartDate.HasValue)
        {
            return now;
        }

        var requestedStart = new DateTimeOffset(
            enrollment.StartDate.Value.ToDateTime(TimeOnly.MinValue),
            TimeSpan.Zero);
        return requestedStart > now ? requestedStart : now;
    }

    private static bool IsAccessExpired(Enrollment enrollment, DateTimeOffset now)
        => enrollment.AccessExpiresAt.HasValue && enrollment.AccessExpiresAt <= now;

    private async Task<Enrollment?> FindPaymentEnrollmentAsync(
        Guid studentId,
        Guid? enrollmentId,
        Guid programId,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Enrollments
            .Include(x => x.Program)
                .ThenInclude(x => x!.Category)
            .Include(x => x.ProgramPlan)
            .Where(x => x.StudentId == studentId && x.Status != EnrollmentStatus.Cancelled);

        return enrollmentId.HasValue
            ? await query.FirstOrDefaultAsync(x => x.Id == enrollmentId.Value, cancellationToken)
            : await query
                .Where(x => x.ProgramId == programId)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Coupon> FindCouponAsync(string code, CancellationToken cancellationToken)
    {
        var normalizedCode = RequiredText(code, nameof(code), 2, 80).ToUpperInvariant();
        return await dbContext.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Code == normalizedCode, cancellationToken)
            ?? throw new AppException("That coupon code was not found.", 404, "coupon_not_found");
    }

    private Task<string?> GetStudentEmailAsync(Guid studentId, CancellationToken cancellationToken)
    {
        return dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == studentId)
            .Select(x => x.Email)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<CouponEvaluation> EvaluateCouponAsync(
        Coupon coupon,
        Guid studentId,
        string? studentEmail,
        Enrollment enrollment,
        decimal originalAmount,
        PaymentMode mode,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (mode != PaymentMode.RemainingBalance)
        {
            throw new AppException("Coupons can only be used on the remaining balance. The initial reserve payment is never discounted.", 400, "coupon_remaining_only");
        }

        if (!coupon.IsActive || (coupon.StartsAt.HasValue && coupon.StartsAt.Value > now) || (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < now))
        {
            throw new AppException("This coupon is not active or is outside its valid dates.", 400, "coupon_not_active");
        }

        if (coupon.MinimumOrderAmount.HasValue && originalAmount < coupon.MinimumOrderAmount.Value)
        {
            throw new AppException($"This coupon requires a remaining balance of at least INR {coupon.MinimumOrderAmount.Value:n0}.", 400, "coupon_minimum_not_met");
        }

        var targetStudentIds = DeserializeGuidList(coupon.TargetStudentIdsJson);
        var targetStudentEmails = DeserializeStringList(coupon.TargetStudentEmailsJson);
        var targetProgramIds = DeserializeGuidList(coupon.TargetProgramIdsJson);
        var targetCategoryIds = DeserializeGuidList(coupon.TargetCategoryIdsJson);
        var normalizedStudentEmail = studentEmail?.Trim().ToLowerInvariant();
        var isSelectedStudent = targetStudentIds.Contains(studentId) ||
            (!string.IsNullOrWhiteSpace(normalizedStudentEmail) && targetStudentEmails.Contains(normalizedStudentEmail, StringComparer.OrdinalIgnoreCase));

        if (coupon.AudienceType == CouponAudienceType.SelectedStudents && !isSelectedStudent)
        {
            throw new AppException("This coupon is not assigned to your student account.", 403, "coupon_student_not_eligible");
        }

        var hasPreviousEnrollment = await dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(x => x.StudentId == studentId && x.Id != enrollment.Id && x.Status != EnrollmentStatus.Cancelled, cancellationToken)
            || await dbContext.PaymentTransactions
                .AsNoTracking()
                .AnyAsync(x => x.StudentId == studentId && x.Status == PaymentStatus.Verified && x.Mode != PaymentMode.ReserveSeat, cancellationToken);
        if (coupon.AudienceType == CouponAudienceType.NewStudents && hasPreviousEnrollment)
        {
            throw new AppException("This coupon is only available to new students.", 403, "coupon_student_not_eligible");
        }

        if (coupon.AudienceType == CouponAudienceType.ExistingStudents && !hasPreviousEnrollment)
        {
            throw new AppException("This coupon is only available to existing students.", 403, "coupon_student_not_eligible");
        }

        if (targetProgramIds.Count > 0 && !targetProgramIds.Contains(enrollment.ProgramId))
        {
            throw new AppException("This coupon is not valid for the selected program.", 403, "coupon_program_not_eligible");
        }

        if (targetCategoryIds.Count > 0 && (enrollment.Program is null || !targetCategoryIds.Contains(enrollment.Program.CategoryId)))
        {
            throw new AppException("This coupon is not valid for the selected category.", 403, "coupon_category_not_eligible");
        }

        var activeRedemptions = dbContext.CouponRedemptions
            .AsNoTracking()
            .Where(x => x.CouponId == coupon.Id &&
                (x.Status == CouponRedemptionStatus.Redeemed ||
                 (x.Status == CouponRedemptionStatus.Reserved && x.ExpiresAt > now)));

        if (coupon.MaxRedemptions.HasValue && await activeRedemptions.CountAsync(cancellationToken) >= coupon.MaxRedemptions.Value)
        {
            throw new AppException("This coupon has reached its redemption limit.", 409, "coupon_limit_reached");
        }

        if (await activeRedemptions.CountAsync(x => x.StudentId == studentId, cancellationToken) >= coupon.MaxRedemptionsPerStudent)
        {
            throw new AppException("You have already used this coupon the maximum allowed number of times.", 409, "coupon_student_limit_reached");
        }

        if (await activeRedemptions.AnyAsync(x => x.EnrollmentId == enrollment.Id, cancellationToken))
        {
            throw new AppException("This coupon is already applied to this enrollment.", 409, "coupon_already_applied");
        }

        var discountAmount = coupon.IsPercentage
            ? Math.Round(originalAmount * coupon.DiscountValue / 100m, 2, MidpointRounding.AwayFromZero)
            : coupon.DiscountValue;
        if (coupon.MaximumDiscountAmount.HasValue)
        {
            discountAmount = Math.Min(discountAmount, coupon.MaximumDiscountAmount.Value);
        }

        discountAmount = Math.Min(Math.Max(discountAmount, 0), originalAmount);
        return new CouponEvaluation(
            coupon.Code,
            coupon.Description,
            originalAmount,
            discountAmount,
            Math.Max(originalAmount - discountAmount, 0));
    }

    private static bool HasFullAccess(Enrollment enrollment, DateTimeOffset now)
        => !IsAccessNotStarted(enrollment, now) && !IsAccessExpired(enrollment, now) && enrollment.PaidAmount + enrollment.DiscountAmount >= enrollment.TotalAmount && enrollment.TotalAmount > 0;

    private static void EnsureFullAccess(Enrollment enrollment, DateTimeOffset now)
    {
        if (!HasFullAccess(enrollment, now))
        {
            var isNotStarted = IsAccessNotStarted(enrollment, now);
            var isExpired = IsAccessExpired(enrollment, now);
            throw new AppException(
                isNotStarted
                    ? $"Your access starts on {enrollment.StartDate!.Value:dd MMM yyyy}."
                    : isExpired
                    ? "Your six-month access period has ended. Renew access to continue."
                    : "Complete the remaining payment to unlock projects and full course access.",
                403,
                isNotStarted ? "access_not_started" : isExpired ? "access_expired" : "full_payment_required");
        }
    }

    private async Task ActivateCheckoutAccountAsync(Guid studentId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == studentId, cancellationToken);
        if (user is null || (user.EmailConfirmed && user.AccountStatus == AccountStatus.Active))
        {
            return;
        }

        user.EmailConfirmed = true;
        if (user.AccountStatus == AccountStatus.PendingEmailVerification)
        {
            user.AccountStatus = AccountStatus.Active;
        }

        Audit("Student.AccountActivatedAfterPayment", new { studentId });
    }

    private void ApplyVerifiedPayment(PaymentTransaction payment, DateTimeOffset now)
    {
        var enrollment = payment.Enrollment;
        if (enrollment is null)
        {
            return;
        }

        var isRenewal = IsAccessExpired(enrollment, now);
        if (isRenewal && payment.Mode == PaymentMode.ReserveSeat)
        {
            enrollment.PaidAmount = 0;
            enrollment.DiscountAmount = 0;
            enrollment.AccessCycle = Math.Max(enrollment.AccessCycle + 1, 2);
            enrollment.FullAccessUnlockedAt = null;
        }

        enrollment.TotalAmount = enrollment.ProgramPlan is null
            ? enrollment.TotalAmount
            : GetFixedPricing(enrollment.ProgramPlan).TotalAmount;
        enrollment.DiscountAmount = Math.Min(
            enrollment.DiscountAmount + payment.DiscountAmount,
            Math.Max(enrollment.TotalAmount - enrollment.PaidAmount, 0));
        enrollment.PaidAmount = Math.Min(enrollment.PaidAmount + payment.Amount, enrollment.TotalAmount);
        if (isRenewal || payment.Mode == PaymentMode.ReserveSeat ||
            (payment.Mode == PaymentMode.PayInFull && !enrollment.AccessExpiresAt.HasValue))
        {
            enrollment.AccessExpiresAt = ResolveAccessStart(enrollment, now)
                .AddMonths(Math.Clamp(Payments.AccessDurationMonths, 1, 24));
        }

        if (enrollment.PaidAmount + enrollment.DiscountAmount >= enrollment.TotalAmount)
        {
            enrollment.Status = EnrollmentStatus.Active;
            enrollment.FullAccessUnlockedAt ??= now;
            enrollment.LockedReason = null;
        }
        else
        {
            enrollment.Status = EnrollmentStatus.Reserved;
            enrollment.LockedReason = "Preview access is limited to the first module. Pay the remaining balance to unlock the complete program.";
        }

        payment.InvoiceNumber ??= $"JOVIQ-{now:yyyyMMdd}-{payment.Id.ToString("N")[..8].ToUpperInvariant()}";
    }

    private sealed record FixedPlanPricing(string Name, decimal TotalAmount, decimal ReserveAmount);

    private static ProgramSummaryResponse MapProgramSummary(LearningProgram program)
    {
        var startingPrice = program.Plans
            .Where(x => x.IsActive)
            .Select(GetPlanTotal)
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
        IReadOnlyDictionary<Guid, LessonProgress> progress,
        bool includeInactive,
        Enrollment? enrollment = null)
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
            program.Modules
                .Where(module => includeInactive || module.IsActive)
                .OrderBy(x => x.SortOrder)
                .Select((module, index) => MapCurriculumModule(module, enrollment, progress, includeInactive, index == 0))
                .ToList(),
            projects.Select(project => MapProject(project, null)).ToList());
    }

    private static List<LessonResource> MapLessonResources(IEnumerable<LessonResourceRequest> resources)
    {
        return resources
            .Where(resource => !string.IsNullOrWhiteSpace(resource.Url))
            .Select(resource => new LessonResource
            {
                Id = Guid.NewGuid(),
                Title = RequiredText(resource.Title, nameof(resource.Title), 1, 180),
                ResourceType = RequiredText(resource.ResourceType, nameof(resource.ResourceType), 1, 80),
                Url = RequiredText(resource.Url, nameof(resource.Url), 1, 500)
            })
            .ToList();
    }

    private static void ApplyOrder<T>(
        IReadOnlyList<T> items,
        IReadOnlyList<Guid> orderedIds,
        string itemType,
        Func<T, Guid> getId,
        Action<T, int> setOrder)
    {
        var requestedIds = orderedIds.Distinct().ToList();
        var currentIds = items.Select(getId).ToHashSet();
        if (requestedIds.Count != items.Count || requestedIds.Any(id => !currentIds.Contains(id)))
        {
            throw Validation("orderedIds", $"The orderedIds list must contain every {itemType} exactly once.");
        }

        for (var index = 0; index < requestedIds.Count; index++)
        {
            var item = items.First(value => getId(value) == requestedIds[index]);
            setOrder(item, index + 1);
        }
    }

    private static ProgramPlanResponse MapPlan(ProgramPlan plan)
    {
        var pricing = GetFixedPricing(plan);
        return new ProgramPlanResponse(
            plan.Id,
            plan.ProgramId,
            pricing.Name,
            plan.Code,
            pricing.TotalAmount,
            pricing.TotalAmount,
            pricing.ReserveAmount,
            DeserializeList(plan.FeaturesJson),
            plan.IsActive);
    }

    private static CurriculumModuleResponse MapCurriculumModule(
        CurriculumModule module,
        Enrollment? enrollment,
        IReadOnlyDictionary<Guid, LessonProgress> progress,
        bool includeInactive,
        bool isPreviewModule = false)
    {
        return new CurriculumModuleResponse(
            module.Id,
            module.ProgramId,
            module.Title,
            module.Description,
            module.SortOrder,
            module.IsActive,
            module.Lessons
                .Where(lesson => includeInactive || lesson.IsActive)
                .OrderBy(x => x.SortOrder)
                .Select(lesson => MapLesson(lesson, enrollment, progress.GetValueOrDefault(lesson.Id), isPreviewModule))
                .ToList());
    }

    private static LessonResponse MapLesson(Lesson lesson, Enrollment? enrollment, LessonProgress? progress, bool isPreviewModule = false)
    {
        var hasFullAccess = enrollment is null || HasFullAccess(enrollment, DateTimeOffset.UtcNow);
        var hasPreviewAccess = enrollment is not null && !IsAccessExpired(enrollment, DateTimeOffset.UtcNow) && enrollment.PaidAmount > 0;
        var isLocked = enrollment is not null && !hasFullAccess && (!hasPreviewAccess || !isPreviewModule);
        return new LessonResponse(
            lesson.Id,
            lesson.ModuleId,
            lesson.Title,
            lesson.Summary,
            isLocked ? null : lesson.VideoUrl,
            isLocked ? null : lesson.NotesUrl,
            lesson.DurationMinutes,
            lesson.AccessLevel.ToString(),
            lesson.SortOrder,
            lesson.IsActive,
            isLocked,
            progress?.ProgressPercentage ?? 0,
            progress?.IsCompleted ?? false,
            lesson.Resources.Select(resource => new LessonResourceResponse(
                resource.Id,
                resource.Title,
                resource.ResourceType,
                isLocked ? string.Empty : resource.Url)).ToList());
    }

    private static EnrollmentResponse MapEnrollment(
        Enrollment enrollment,
        string? studentName = null,
        string? studentEmail = null,
        string? studentPhone = null)
    {
        return new EnrollmentResponse(
            enrollment.Id,
            enrollment.StudentId,
            enrollment.ProgramId,
            enrollment.Program?.Slug ?? string.Empty,
            enrollment.Program?.Title ?? "Program",
            enrollment.ProgramPlanId,
            enrollment.ProgramPlan?.Name,
            enrollment.ProgramPlan?.Code,
            enrollment.Status.ToString(),
            enrollment.TotalAmount,
            enrollment.PaidAmount,
            Math.Max(enrollment.TotalAmount - enrollment.PaidAmount - enrollment.DiscountAmount, 0),
            enrollment.EnrolledAt,
            enrollment.StartDate,
            enrollment.FullAccessUnlockedAt,
            enrollment.LockedReason,
            enrollment.AccessExpiresAt,
            IsAccessExpired(enrollment, DateTimeOffset.UtcNow),
            HasFullAccess(enrollment, DateTimeOffset.UtcNow),
            enrollment.AccessCycle,
            studentName,
            studentEmail,
            studentPhone);
    }

    private static PaymentTransactionResponse MapPayment(
        PaymentTransaction payment,
        string? studentName = null,
        string? studentEmail = null)
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
            payment.VerifiedAt,
            payment.InvoiceNumber,
            payment.FailureReason,
            payment.OriginalAmount > 0 ? payment.OriginalAmount : payment.Amount,
            payment.DiscountAmount,
            payment.CouponCode,
            payment.StudentId,
            studentName,
            studentEmail,
            payment.Enrollment?.Program?.Title,
            payment.Enrollment?.ProgramPlan?.Name);
    }

    private static ProjectResponse MapProject(Project project, ProjectSubmission? submission, int? assignedStudentCount = null)
    {
        return new ProjectResponse(
            project.Id,
            project.ProgramId,
            project.Title,
            project.Description,
            DeserializeList(project.RequiredArtifactsJson),
            DeserializeProjectLinks(project.UsefulLinksJson),
            project.ReferenceMediaUrl,
            project.Deadline,
            project.MaxScore,
            project.IsPublished,
            assignedStudentCount ?? project.Assignments.Count,
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
            submission.FileAssetId,
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
            coupon.ExpiresAt,
            coupon.AudienceType,
            coupon.MinimumOrderAmount,
            coupon.MaximumDiscountAmount,
            coupon.MaxRedemptions,
            coupon.MaxRedemptionsPerStudent,
            DeserializeGuidList(coupon.TargetStudentIdsJson),
            DeserializeStringList(coupon.TargetStudentEmailsJson),
            DeserializeGuidList(coupon.TargetProgramIdsJson),
            DeserializeGuidList(coupon.TargetCategoryIdsJson));
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
                Name = "Launch",
                Code = "SELF",
                ActualPrice = 8000m,
                OfferPrice = 8000m,
                Features = new[]
                {
                    "Lesson Replays", "Complete Curriculum", "Projects", "LMS Access",
                    "Certificate", "Basic Support"
                }
            },
            new
            {
                Name = "Elevate",
                Code = "INTERMEDIATE",
                ActualPrice = 10000m,
                OfferPrice = 10000m,
                Features = new[]
                {
                    "Live Sessions", "Project Reviews", "Resume Review",
                    "Interview Preparation", "Priority Support"
                }
            },
            new
            {
                Name = "Mastery",
                Code = "MASTER",
                ActualPrice = 15000m,
                OfferPrice = 15000m,
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
                ReserveAmount = plan.Code == "MASTER" ? 3000m : 1500m,
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

    private static void ValidateCouponRequest(CreateCouponRequest request)
    {
        if (!Enum.IsDefined(request.AudienceType))
        {
            throw Validation(nameof(request.AudienceType), "Choose a valid coupon audience.");
        }

        if (request.DiscountValue <= 0 || (request.IsPercentage && request.DiscountValue > 100))
        {
            throw Validation(nameof(request.DiscountValue), request.IsPercentage
                ? "Percentage discount must be greater than 0 and no more than 100."
                : "Fixed discount must be greater than 0.");
        }

        EnsureMoney(request.MinimumOrderAmount.GetValueOrDefault(), nameof(request.MinimumOrderAmount));
        EnsureMoney(request.MaximumDiscountAmount.GetValueOrDefault(), nameof(request.MaximumDiscountAmount));
        if (request.MaxRedemptions is <= 0)
        {
            throw Validation(nameof(request.MaxRedemptions), "Maximum redemptions must be greater than 0 when provided.");
        }

        if (request.MaxRedemptionsPerStudent <= 0)
        {
            throw Validation(nameof(request.MaxRedemptionsPerStudent), "Per-student redemptions must be greater than 0.");
        }

        if (request.StartsAt.HasValue && request.ExpiresAt.HasValue && request.StartsAt > request.ExpiresAt)
        {
            throw Validation(nameof(request.ExpiresAt), "Expiry must be after the start date.");
        }

        var targetStudentIds = request.TargetStudentIds.Distinct().ToList();
        var targetStudentEmails = NormalizeCouponEmails(request.TargetStudentEmails);
        if (request.AudienceType == CouponAudienceType.SelectedStudents && targetStudentIds.Count == 0 && targetStudentEmails.Count == 0)
        {
            throw Validation(nameof(request.TargetStudentIds), "Select at least one student or enter at least one student email.");
        }
    }

    private async Task EnsureCouponTargetsExistAsync(CreateCouponRequest request, CancellationToken cancellationToken)
    {
        var programIds = request.TargetProgramIds.Distinct().ToList();
        if (programIds.Count > 0 && await dbContext.LearningPrograms.CountAsync(x => programIds.Contains(x.Id), cancellationToken) != programIds.Count)
        {
            throw new AppException("One or more targeted programs were not found.", 400, "coupon_program_target_invalid");
        }

        var categoryIds = request.TargetCategoryIds.Distinct().ToList();
        if (categoryIds.Count > 0 && await dbContext.LearningProgramCategories.CountAsync(x => categoryIds.Contains(x.Id), cancellationToken) != categoryIds.Count)
        {
            throw new AppException("One or more targeted categories were not found.", 400, "coupon_category_target_invalid");
        }

        var studentIds = request.TargetStudentIds.Distinct().ToList();
        if (studentIds.Count > 0 && await dbContext.Users.CountAsync(x => studentIds.Contains(x.Id), cancellationToken) != studentIds.Count)
        {
            throw new AppException("One or more targeted students were not found.", 400, "coupon_student_target_invalid");
        }
    }

    private static IReadOnlyList<string> NormalizeCouponEmails(IEnumerable<string> values)
    {
        var normalized = new List<string>();
        foreach (var value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            normalized.Add(ValidateEmail(value, nameof(CreateCouponRequest.TargetStudentEmails)));
        }

        return normalized.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
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

    private static string SerializeGuidList(IEnumerable<Guid> values)
    {
        return JsonSerializer.Serialize(values.Distinct().ToList(), JsonOptions);
    }

    private static string SerializeProjectLinks(IEnumerable<ProjectLinkRequest> values)
    {
        var normalized = new List<ProjectLinkResponse>();
        foreach (var value in values)
        {
            if (string.IsNullOrWhiteSpace(value.Label) && string.IsNullOrWhiteSpace(value.Url))
            {
                continue;
            }

            normalized.Add(new ProjectLinkResponse(
                RequiredText(value.Label, "UsefulLinks", 2, 120),
                OptionalUrl(value.Url, "UsefulLinks")
                    ?? throw Validation("UsefulLinks", "Each project link must include a valid URL.")));
        }

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

    private static IReadOnlyList<Guid> DeserializeGuidList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<Guid>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static IReadOnlyList<string> DeserializeStringList(string? json)
    {
        return DeserializeList(json)
            .Select(value => value.Trim().ToLowerInvariant())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static IReadOnlyList<ProjectLinkResponse> DeserializeProjectLinks(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<ProjectLinkResponse>>(json, JsonOptions) ?? [];
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

    private sealed record CouponEvaluation(
        string Code,
        string Description,
        decimal OriginalAmount,
        decimal DiscountAmount,
        decimal PayableAmount);

    private sealed record LearningProgress(int Completed, int Total, int Percentage);
}
