namespace Joviq.Lms.Application.Common.Exceptions;

public class AppException : Exception
{
    public AppException(string message, int statusCode = 400, string errorCode = "app_error")
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }

    public int StatusCode { get; }

    public string ErrorCode { get; }
}
