using Joviq.Lms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Joviq.Lms.Infrastructure.Persistence.Configurations;

public sealed class LearningProgramCategoryConfiguration : IEntityTypeConfiguration<LearningProgramCategory>
{
    public void Configure(EntityTypeBuilder<LearningProgramCategory> builder)
    {
        builder.ToTable("program_categories");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(140).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(600).IsRequired();
    }
}

public sealed class LearningProgramConfiguration : IEntityTypeConfiguration<LearningProgram>
{
    public void Configure(EntityTypeBuilder<LearningProgram> builder)
    {
        builder.ToTable("programs");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => new { x.CategoryId, x.Status, x.SortOrder });
        builder.Property(x => x.Slug).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.ShortDescription).HasMaxLength(600).IsRequired();
        builder.Property(x => x.Overview).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.Level).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Duration).HasMaxLength(80).IsRequired();
        builder.Property(x => x.LearningMode).HasMaxLength(120).IsRequired();
        builder.Property(x => x.CertificationName).HasMaxLength(180).IsRequired();
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
        builder.Property(x => x.SkillsJson).HasColumnType("jsonb");
        builder.Property(x => x.OutcomesJson).HasColumnType("jsonb");
        builder.Property(x => x.FaqsJson).HasColumnType("jsonb");
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.HasOne(x => x.Category)
            .WithMany(x => x.Programs)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ProgramPlanConfiguration : IEntityTypeConfiguration<ProgramPlan>
{
    public void Configure(EntityTypeBuilder<ProgramPlan> builder)
    {
        builder.ToTable("program_plans");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ProgramId, x.Code }).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(80).IsRequired();
        builder.Property(x => x.ActualPrice).HasPrecision(12, 2);
        builder.Property(x => x.OfferPrice).HasPrecision(12, 2);
        builder.Property(x => x.ReserveAmount).HasPrecision(12, 2);
        builder.Property(x => x.FeaturesJson).HasColumnType("jsonb");
        builder.HasOne(x => x.Program)
            .WithMany(x => x.Plans)
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CurriculumModuleConfiguration : IEntityTypeConfiguration<CurriculumModule>
{
    public void Configure(EntityTypeBuilder<CurriculumModule> builder)
    {
        builder.ToTable("curriculum_modules");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ProgramId, x.IsActive, x.SortOrder });
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1200).IsRequired();
        builder.HasOne(x => x.Program)
            .WithMany(x => x.Modules)
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.ToTable("lessons");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ModuleId, x.IsActive, x.SortOrder });
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(1200).IsRequired();
        builder.Property(x => x.VideoUrl).HasMaxLength(500);
        builder.Property(x => x.NotesUrl).HasMaxLength(500);
        builder.Property(x => x.AccessLevel).HasConversion<string>().HasMaxLength(64);
        builder.HasOne(x => x.Module)
            .WithMany(x => x.Lessons)
            .HasForeignKey(x => x.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class LessonResourceConfiguration : IEntityTypeConfiguration<LessonResource>
{
    public void Configure(EntityTypeBuilder<LessonResource> builder)
    {
        builder.ToTable("lesson_resources");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.ResourceType).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Url).HasMaxLength(500).IsRequired();
        builder.HasOne(x => x.Lesson)
            .WithMany(x => x.Resources)
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class LessonProgressConfiguration : IEntityTypeConfiguration<LessonProgress>
{
    public void Configure(EntityTypeBuilder<LessonProgress> builder)
    {
        builder.ToTable("lesson_progress");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.StudentId, x.LessonId }).IsUnique();
        builder.HasOne(x => x.Lesson)
            .WithMany()
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.ToTable("enrollments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.StudentId, x.ProgramId });
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.TotalAmount).HasPrecision(12, 2);
        builder.Property(x => x.PaidAmount).HasPrecision(12, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(12, 2);
        builder.Property(x => x.StartDate).HasColumnType("date");
        builder.Property(x => x.LockedReason).HasMaxLength(500);
        builder.HasOne(x => x.Program)
            .WithMany()
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ProgramPlan)
            .WithMany()
            .HasForeignKey(x => x.ProgramPlanId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.ToTable("payment_transactions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.GatewayOrderId).IsUnique();
        builder.HasIndex(x => new { x.StudentId, x.Status });
        builder.Property(x => x.Gateway).HasMaxLength(80).IsRequired();
        builder.Property(x => x.GatewayOrderId).HasMaxLength(160).IsRequired();
        builder.Property(x => x.GatewayPaymentId).HasMaxLength(160);
        builder.Property(x => x.Mode).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Amount).HasPrecision(12, 2);
        builder.Property(x => x.OriginalAmount).HasPrecision(12, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(12, 2);
        builder.Property(x => x.CouponCode).HasMaxLength(80);
        builder.Property(x => x.Currency).HasMaxLength(12).IsRequired();
        builder.Property(x => x.FailureReason).HasMaxLength(500);
        builder.Property(x => x.InvoiceNumber).HasMaxLength(80);
        builder.HasIndex(x => x.GatewayPaymentId)
            .IsUnique()
            .HasFilter("\"GatewayPaymentId\" IS NOT NULL");
        builder.HasOne(x => x.Enrollment)
            .WithMany()
            .HasForeignKey(x => x.EnrollmentId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.Coupon)
            .WithMany()
            .HasForeignKey(x => x.CouponId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.ToTable("coupons");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Code).IsUnique();
        builder.Property(x => x.Code).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500).IsRequired();
        builder.Property(x => x.DiscountValue).HasPrecision(12, 2);
        builder.Property(x => x.AudienceType).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.MinimumOrderAmount).HasPrecision(12, 2);
        builder.Property(x => x.MaximumDiscountAmount).HasPrecision(12, 2);
        builder.Property(x => x.TargetStudentIdsJson).HasColumnType("jsonb");
        builder.Property(x => x.TargetStudentEmailsJson).HasColumnType("jsonb");
        builder.Property(x => x.TargetProgramIdsJson).HasColumnType("jsonb");
        builder.Property(x => x.TargetCategoryIdsJson).HasColumnType("jsonb");
    }
}

public sealed class CouponRedemptionConfiguration : IEntityTypeConfiguration<CouponRedemption>
{
    public void Configure(EntityTypeBuilder<CouponRedemption> builder)
    {
        builder.ToTable("coupon_redemptions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.PaymentTransactionId).IsUnique();
        builder.HasIndex(x => new { x.CouponId, x.StudentId, x.Status });
        builder.HasIndex(x => new { x.CouponId, x.Status });
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.OriginalAmount).HasPrecision(12, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(12, 2);
        builder.Property(x => x.FinalAmount).HasPrecision(12, 2);
        builder.HasOne(x => x.Coupon)
            .WithMany()
            .HasForeignKey(x => x.CouponId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ProgramId, x.IsPublished });
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2500).IsRequired();
        builder.Property(x => x.RequiredArtifactsJson).HasColumnType("jsonb");
        builder.Property(x => x.UsefulLinksJson).HasColumnType("jsonb");
        builder.Property(x => x.ReferenceMediaUrl).HasMaxLength(1000);
        builder.Property(x => x.MaxScore).HasPrecision(8, 2);
        builder.HasOne(x => x.Program)
            .WithMany()
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ProjectAssignmentConfiguration : IEntityTypeConfiguration<ProjectAssignment>
{
    public void Configure(EntityTypeBuilder<ProjectAssignment> builder)
    {
        builder.ToTable("project_assignments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ProjectId, x.StudentId }).IsUnique();
        builder.HasIndex(x => new { x.StudentId, x.ProjectId });
        builder.HasOne(x => x.Project)
            .WithMany(x => x.Assignments)
            .HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Enrollment)
            .WithMany()
            .HasForeignKey(x => x.EnrollmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class ProjectSubmissionConfiguration : IEntityTypeConfiguration<ProjectSubmission>
{
    public void Configure(EntityTypeBuilder<ProjectSubmission> builder)
    {
        builder.ToTable("project_submissions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ProjectId, x.StudentId });
        builder.Property(x => x.GitHubUrl).HasMaxLength(500);
        builder.Property(x => x.DemoUrl).HasMaxLength(500);
        builder.Property(x => x.DocumentationUrl).HasMaxLength(500);
        builder.Property(x => x.PresentationUrl).HasMaxLength(500);
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.Score).HasPrecision(8, 2);
        builder.Property(x => x.Feedback).HasMaxLength(2500);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.HasOne(x => x.Project)
            .WithMany()
            .HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Enrollment)
            .WithMany()
            .HasForeignKey(x => x.EnrollmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.ToTable("certificates");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CertificateId).IsUnique();
        builder.HasIndex(x => x.VerificationSlug).IsUnique();
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.CertificateId).HasMaxLength(120).IsRequired();
        builder.Property(x => x.VerificationSlug).HasMaxLength(160).IsRequired();
        builder.Property(x => x.VerificationUrl).HasMaxLength(500);
        builder.Property(x => x.QrCodeUrl).HasMaxLength(500);
        builder.Property(x => x.AuthorizedSignatory).HasMaxLength(180);
        builder.HasOne(x => x.Program)
            .WithMany()
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Enrollment)
            .WithMany()
            .HasForeignKey(x => x.EnrollmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}


public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.Status, x.CreatedAt });
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.ActionUrl).HasMaxLength(500);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
    }
}

public sealed class CallbackRequestConfiguration : IEntityTypeConfiguration<CallbackRequest>
{
    public void Configure(EntityTypeBuilder<CallbackRequest> builder)
    {
        builder.ToTable("callback_requests");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(32).IsRequired();
        builder.Property(x => x.InterestedProgram).HasMaxLength(180);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Notes).HasMaxLength(1200);
    }
}

public sealed class EnquiryConfiguration : IEntityTypeConfiguration<Enquiry>
{
    public void Configure(EntityTypeBuilder<Enquiry> builder)
    {
        builder.ToTable("enquiries");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Topic).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(2500).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
    }
}
