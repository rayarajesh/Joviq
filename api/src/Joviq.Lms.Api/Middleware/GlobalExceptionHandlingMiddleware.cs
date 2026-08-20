using Joviq.Lms.Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Middleware;

public sealed class GlobalExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationAppException exception)
        {
            await WriteValidationProblemAsync(context, exception);
        }
        catch (AppException exception)
        {
            await WriteProblemAsync(context, exception.StatusCode, exception.Message, exception.ErrorCode);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteProblemAsync(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred.", "server_error");
        }
    }

    private static async Task WriteValidationProblemAsync(HttpContext context, ValidationAppException exception)
    {
        context.Response.StatusCode = exception.StatusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ValidationProblemDetails(exception.Errors)
        {
            Title = exception.Message,
            Status = exception.StatusCode,
            Type = $"https://api.joviq.com/problems/{exception.ErrorCode}",
            Instance = context.Request.Path
        };

        problem.Extensions["correlationId"] = context.TraceIdentifier;
        await context.Response.WriteAsJsonAsync(problem);
    }

    private static async Task WriteProblemAsync(HttpContext context, int statusCode, string title, string errorCode)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Title = title,
            Status = statusCode,
            Type = $"https://api.joviq.com/problems/{errorCode}",
            Instance = context.Request.Path
        };

        problem.Extensions["errorCode"] = errorCode;
        problem.Extensions["correlationId"] = context.TraceIdentifier;

        await context.Response.WriteAsJsonAsync(problem);
    }
}
