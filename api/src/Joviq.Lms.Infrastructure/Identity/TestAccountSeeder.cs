using System.Text.Json;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Joviq.Lms.Infrastructure.Identity;

public static class TestAccountSeeder
{
    public const string AdminEmail = "testadminjoviq@gmail.com";
    public const string StudentEmail = "teststudentjoviq@gmail.com";

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        if (!configuration.GetValue<bool>("TestAccounts:Enabled")) return;
        var adminPassword = configuration["TestAccounts:AdminPassword"];
        var studentPassword = configuration["TestAccounts:StudentPassword"];
        if (string.IsNullOrWhiteSpace(adminPassword) || string.IsNullOrWhiteSpace(studentPassword))
            throw new InvalidOperationException("Test-account passwords must be supplied through secret configuration.");
        if (string.Equals(configuration["SeedAdmin:Email"], AdminEmail, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(configuration["SeedAdmin:Email"], StudentEmail, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The real administrator cannot use a test-account email.");

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var program = await db.LearningPrograms.Include(x => x.Plans)
            .SingleOrDefaultAsync(x => x.Slug == "data-science" && x.Status == ProgramStatus.Published)
            ?? throw new InvalidOperationException("Publish Data Science before seeding the test enrollment.");
        var plan = program.Plans.SingleOrDefault(x => x.Code == "SELF" && x.IsActive && x.OfferPrice > 0)
            ?? throw new InvalidOperationException("Data Science requires an active Launch plan.");

        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        foreach (var role in new[] { RoleNames.Admin, RoleNames.Student })
            if (!await roles.RoleExistsAsync(role)) Ensure(await roles.CreateAsync(new IdentityRole<Guid>(role)));

        var resetPasswords = configuration.GetValue<bool>("TestAccounts:ResetPasswords");
        await EnsureUserAsync(users, AdminEmail, "Joviq Test Admin", RoleNames.Admin, adminPassword, resetPasswords);
        var student = await EnsureUserAsync(users, StudentEmail, "Joviq Test Student", RoleNames.Student, studentPassword, resetPasswords);
        if (!await db.StudentProfiles.AnyAsync(x => x.UserId == student.Id))
            db.StudentProfiles.Add(new StudentProfile { UserId = student.Id });

        var enrollments = await db.Enrollments.Where(x => x.StudentId == student.Id && x.Status != EnrollmentStatus.Cancelled).ToListAsync();
        if (enrollments.Count > 1 || enrollments.Any(x => x.ProgramId != program.Id || x.ProgramPlanId != plan.Id || x.PaidAmount != 0))
            throw new InvalidOperationException("The test student already has a different or paid enrollment; it was not changed.");
        var enrollment = enrollments.SingleOrDefault();
        if (enrollment is null)
        {
            enrollment = new Enrollment
            {
                Id = Guid.NewGuid(), StudentId = student.Id, ProgramId = program.Id, ProgramPlanId = plan.Id,
                EnrolledAt = DateTimeOffset.UtcNow, StartDate = DateOnly.FromDateTime(DateTime.UtcNow)
            };
            db.Enrollments.Add(enrollment);
        }
        if (enrollment.DiscountAmount != plan.OfferPrice || enrollment.FullAccessUnlockedAt is null)
        {
            enrollment.TotalAmount = plan.OfferPrice;
            enrollment.DiscountAmount = plan.OfferPrice;
            enrollment.Status = EnrollmentStatus.Active;
            enrollment.FullAccessUnlockedAt = DateTimeOffset.UtcNow;
            enrollment.AccessExpiresAt ??= DateTimeOffset.UtcNow.AddMonths(6);
            enrollment.LockedReason = null;
            db.AuthAuditLogs.Add(new AuthAuditLog
            {
                UserId = student.Id, Email = StudentEmail, EventType = "Seed.TestStudent.CourseFeeWaived",
                MetadataJson = JsonSerializer.Serialize(new { EnrollmentId = enrollment.Id, Program = program.Slug,
                    Plan = plan.Code, WaivedAmount = plan.OfferPrice, Reason = "One free course for designated test student" })
            });
        }
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    private static async Task<ApplicationUser> EnsureUserAsync(UserManager<ApplicationUser> users,
        string email, string name, string role, string password, bool resetPasswords)
    {
        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser { Id = Guid.NewGuid(), FullName = name, UserName = email, Email = email,
                EmailConfirmed = true, AccountStatus = AccountStatus.Active, OnboardingStatus = OnboardingStatus.Completed };
            Ensure(await users.CreateAsync(user, password));
            Ensure(await users.AddToRoleAsync(user, role));
        }
        else
        {
            var currentRoles = await users.GetRolesAsync(user);
            if (currentRoles.Count != 1 || currentRoles[0] != role)
                throw new InvalidOperationException("An existing test email has a different role; no role was changed.");
            if (!await users.CheckPasswordAsync(user, password))
            {
                if (!resetPasswords) throw new InvalidOperationException("Test password differs; enable TestAccounts:ResetPasswords explicitly to replace it.");
                Ensure(await users.ResetPasswordAsync(user, await users.GeneratePasswordResetTokenAsync(user), password));
            }
            user.EmailConfirmed = true;
            user.AccountStatus = AccountStatus.Active;
            user.OnboardingStatus = OnboardingStatus.Completed;
            Ensure(await users.UpdateAsync(user));
        }
        return user;
    }

    private static void Ensure(IdentityResult result)
    {
        if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
    }
}
