using Joviq.Lms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Joviq.Lms.Infrastructure.Persistence.Configurations;

public sealed class UserOtpConfiguration : IEntityTypeConfiguration<UserOtp>
{
    public void Configure(EntityTypeBuilder<UserOtp> builder)
    {
        builder.ToTable("user_otps");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Destination).HasMaxLength(256).IsRequired();
        builder.Property(x => x.DestinationType).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Purpose).HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.CodeHash).HasMaxLength(256).IsRequired();
        builder.Property(x => x.CreatedIp).HasMaxLength(64);
        builder.HasIndex(x => new { x.Destination, x.Purpose, x.ConsumedAt });
        builder.HasIndex(x => x.UserId);
    }
}
