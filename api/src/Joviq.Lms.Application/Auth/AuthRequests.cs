using System.ComponentModel.DataAnnotations;
using Joviq.Lms.Application.Common.Validation;

namespace Joviq.Lms.Application.Auth;

public sealed record RegisterRequest
{
    [Required, MaxLength(160)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, IndianMobileNumber, MaxLength(16)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string Password { get; init; } = string.Empty;

    [Required, Compare(nameof(Password))]
    public string ConfirmPassword { get; init; } = string.Empty;

    public bool AcceptedTerms { get; init; }

    [Required]
    public string TermsVersion { get; init; } = string.Empty;

    [Required]
    public string PrivacyPolicyVersion { get; init; } = string.Empty;
}

public sealed record LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(128)]
    public string Password { get; init; } = string.Empty;

    public bool RememberMe { get; init; }

    [MaxLength(128)]
    public string? DeviceName { get; init; }
}

public sealed record ExternalLoginRequest
{
    [Required, MaxLength(64)]
    public string Provider { get; init; } = string.Empty;

    [Required, MaxLength(256)]
    public string ProviderKey { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [MaxLength(160)]
    public string? FullName { get; init; }

    public bool EmailVerified { get; init; }

    public bool RememberMe { get; init; } = true;

    public bool AllowSignUp { get; init; }

    public bool AcceptedTerms { get; init; }

    [IndianMobileNumber, MaxLength(16)]
    public string? PhoneNumber { get; init; }

    [MaxLength(64)]
    public string? TermsVersion { get; init; }

    [MaxLength(64)]
    public string? PrivacyPolicyVersion { get; init; }

    [MaxLength(128)]
    public string? DeviceName { get; init; }
}

public sealed record EmailRequest
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;
}

public sealed record VerifyEmailRequest
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(8, MinimumLength = 4)]
    public string Otp { get; init; } = string.Empty;
}

public sealed record ForgotPasswordRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;
}

public sealed record VerifyForgotPasswordRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(8, MinimumLength = 4)]
    public string Otp { get; init; } = string.Empty;
}

public sealed record ResetPasswordRequest
{
    [Required]
    public Guid UserId { get; init; }

    [Required]
    public string ResetToken { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string NewPassword { get; init; } = string.Empty;

    [Required, Compare(nameof(NewPassword))]
    public string ConfirmPassword { get; init; } = string.Empty;
}

public sealed record ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string NewPassword { get; init; } = string.Empty;

    [Required, Compare(nameof(NewPassword))]
    public string ConfirmPassword { get; init; } = string.Empty;
}

public sealed record ConfirmAccountDeletionRequest
{
    [Required]
    public string Otp { get; init; } = string.Empty;

    [MaxLength(500)]
    public string? Reason { get; init; }
}
