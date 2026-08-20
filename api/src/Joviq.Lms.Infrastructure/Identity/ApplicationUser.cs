using Joviq.Lms.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Joviq.Lms.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    public DateTimeOffset? DateOfBirth { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? ProfilePhotoUrl { get; set; }

    public AccountStatus AccountStatus { get; set; } = AccountStatus.PendingEmailVerification;

    public OnboardingStatus OnboardingStatus { get; set; } = OnboardingStatus.NotStarted;

    public DateTimeOffset? LastLoginAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
