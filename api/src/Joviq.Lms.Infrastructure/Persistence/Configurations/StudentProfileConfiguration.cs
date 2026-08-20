using Joviq.Lms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Joviq.Lms.Infrastructure.Persistence.Configurations;

public sealed class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> builder)
    {
        builder.ToTable("student_profiles");
        builder.HasKey(x => x.UserId);
        builder.Property(x => x.College).HasMaxLength(200);
        builder.Property(x => x.Degree).HasMaxLength(120);
        builder.Property(x => x.Branch).HasMaxLength(120);
        builder.Property(x => x.CgpaOrPercentage).HasMaxLength(32);
        builder.Property(x => x.TargetJobRole).HasMaxLength(160);
        builder.Property(x => x.SkillsJson).HasColumnType("jsonb");
        builder.Property(x => x.ResumeUrl).HasMaxLength(500);
        builder.Property(x => x.LinkedInUrl).HasMaxLength(500);
        builder.Property(x => x.GitHubUrl).HasMaxLength(500);
        builder.Property(x => x.PortfolioUrl).HasMaxLength(500);
    }
}
