using Joviq.Lms.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Joviq.Lms.Infrastructure.Persistence.Configurations;

public sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("user_sessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RefreshTokenHash).HasMaxLength(256).IsRequired();
        builder.Property(x => x.JwtId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.Property(x => x.DeviceName).HasMaxLength(128);
        builder.Property(x => x.Browser).HasMaxLength(128);
        builder.Property(x => x.OperatingSystem).HasMaxLength(128);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.Property(x => x.UserAgent).HasMaxLength(512);
        builder.Property(x => x.RevokedByIp).HasMaxLength(64);
        builder.Property(x => x.RevocationReason).HasMaxLength(256);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.RefreshTokenHash).IsUnique();
        builder.HasIndex(x => x.RefreshTokenFamilyId);
    }
}
