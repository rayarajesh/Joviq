using Joviq.Lms.Domain.Common;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<UserOtp> UserOtps => Set<UserOtp>();

    public DbSet<AuthAuditLog> AuthAuditLogs => Set<AuthAuditLog>();

    public DbSet<UserConsent> UserConsents => Set<UserConsent>();

    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();

    public DbSet<LearningProgramCategory> LearningProgramCategories => Set<LearningProgramCategory>();

    public DbSet<LearningProgram> LearningPrograms => Set<LearningProgram>();

    public DbSet<ProgramPlan> ProgramPlans => Set<ProgramPlan>();

    public DbSet<CurriculumModule> CurriculumModules => Set<CurriculumModule>();

    public DbSet<Lesson> Lessons => Set<Lesson>();

    public DbSet<LessonResource> LessonResources => Set<LessonResource>();

    public DbSet<LessonProgress> LessonProgress => Set<LessonProgress>();

    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    public DbSet<Coupon> Coupons => Set<Coupon>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ProjectAssignment> ProjectAssignments => Set<ProjectAssignment>();

    public DbSet<ProjectSubmission> ProjectSubmissions => Set<ProjectSubmission>();

    public DbSet<Certificate> Certificates => Set<Certificate>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<CallbackRequest> CallbackRequests => Set<CallbackRequest>();

    public DbSet<Enquiry> Enquiries => Set<Enquiry>();

    public DbSet<Asset> Assets => Set<Asset>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditTimestamps();
        return base.SaveChanges();
    }

    private void ApplyAuditTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ApplicationUser>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
