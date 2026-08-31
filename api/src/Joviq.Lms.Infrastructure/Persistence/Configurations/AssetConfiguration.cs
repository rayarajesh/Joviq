using Joviq.Lms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Joviq.Lms.Infrastructure.Persistence.Configurations;

public sealed class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.ToTable("assets");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.StorageKey).IsUnique();
        builder.HasIndex(x => new { x.Status, x.Purpose, x.CreatedAt });
        builder.HasIndex(x => new { x.OwnerUserId, x.Status });
        builder.HasIndex(x => new { x.ProgramId, x.Purpose });
        builder.HasIndex(x => new { x.LessonId, x.Purpose });
        builder.HasIndex(x => x.UploadTokenHash);

        builder.Property(x => x.OriginalFileName).HasMaxLength(260).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Purpose).HasConversion<string>().HasMaxLength(80);
        builder.Property(x => x.Visibility).HasConversion<string>().HasMaxLength(40);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.StorageProvider).HasMaxLength(60).IsRequired();
        builder.Property(x => x.StorageContainer).HasMaxLength(180).IsRequired();
        builder.Property(x => x.StorageKey).HasMaxLength(600).IsRequired();
        builder.Property(x => x.PublicUrl).HasMaxLength(1000);
        builder.Property(x => x.Checksum).HasMaxLength(160);
        builder.Property(x => x.UploadTokenHash).HasMaxLength(128);

        builder.HasOne(x => x.Program)
            .WithMany()
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Lesson)
            .WithMany()
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
