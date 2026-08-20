using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Joviq.Lms.Application.Common.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class IndianMobileNumberAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null || string.IsNullOrWhiteSpace(value.ToString()))
        {
            return ValidationResult.Success;
        }

        return IndianMobileNumber.Normalize(value.ToString()) is null
            ? new ValidationResult(ErrorMessage ?? "Mobile number must be a valid India +91 number with exactly 10 digits.")
            : ValidationResult.Success;
    }
}

public static partial class IndianMobileNumber
{
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var compact = value
            .Trim()
            .Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .Replace("(", string.Empty)
            .Replace(")", string.Empty);

        if (compact.StartsWith("+91", StringComparison.Ordinal))
        {
            compact = compact[3..];
        }
        else if (compact.StartsWith("91", StringComparison.Ordinal) && compact.Length == 12)
        {
            compact = compact[2..];
        }

        return IndianMobileRegex().IsMatch(compact) ? $"+91{compact}" : null;
    }

    [GeneratedRegex("^[6-9][0-9]{9}$")]
    private static partial Regex IndianMobileRegex();
}
