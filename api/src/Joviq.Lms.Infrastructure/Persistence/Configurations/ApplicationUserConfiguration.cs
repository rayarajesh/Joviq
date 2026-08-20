using Joviq.Lms.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Joviq.Lms.Infrastructure.Persistence.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.City).HasMaxLength(120);
        builder.Property(x => x.State).HasMaxLength(120);
        builder.Property(x => x.ProfilePhotoUrl).HasMaxLength(500);
        builder.Property(x => x.AccountStatus).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.OnboardingStatus).HasConversion<string>().HasMaxLength(64);
    }
}
