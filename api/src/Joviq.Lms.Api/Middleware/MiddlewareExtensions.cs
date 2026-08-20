namespace Joviq.Lms.Api.Middleware;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseApiMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<CorrelationIdMiddleware>();
        app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
        app.UseMiddleware<RequestResponseLoggingMiddleware>();
        return app;
    }
}
