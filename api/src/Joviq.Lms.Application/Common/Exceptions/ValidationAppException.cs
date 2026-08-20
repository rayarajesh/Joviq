namespace Joviq.Lms.Application.Common.Exceptions;

public sealed class ValidationAppException : AppException
{
    public ValidationAppException(IDictionary<string, string[]> errors)
        : base("Validation failed.", 400, "validation_error")
    {
        Errors = errors;
    }

    public IDictionary<string, string[]> Errors { get; }
}
