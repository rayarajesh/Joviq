namespace Joviq.Lms.Application.Common.Models;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public T? Data { get; init; }

    public string? CorrelationId { get; init; }

    public static ApiResponse<T> Ok(T data, string message = "Request successful.", string? correlationId = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            CorrelationId = correlationId
        };
    }
}

public sealed class ApiResponse
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public string? CorrelationId { get; init; }

    public static ApiResponse Ok(string message = "Request successful.", string? correlationId = null)
    {
        return new ApiResponse
        {
            Success = true,
            Message = message,
            CorrelationId = correlationId
        };
    }
}
