using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Joviq.Lms.Api.Middleware;
using Joviq.Lms.Api.Services;
using Joviq.Lms.Application;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Infrastructure;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.OpenApi;

var initializeDatabase = args.Contains("--initialize", StringComparer.Ordinal);
var seedTestAccounts = args.Contains("--seed-test-accounts", StringComparer.Ordinal);
var builder = WebApplication.CreateBuilder(args.Where(arg => arg is not ("--initialize" or "--seed-test-accounts")).ToArray());
DeploymentConfiguration.Validate(builder.Configuration, builder.Environment);
var runtimeConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
if (initializeDatabase)
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = builder.Configuration.GetConnectionString("MigrationConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:MigrationConnection is required for initialization.");
}

builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database", tags: ["ready"]);
builder.Services.AddApplicationInsightsTelemetry();
if (builder.Configuration.GetValue<bool>("Hosting:AzureAppService"))
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        // Only enable this on App Service, where ingress passes through the platform proxy.
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
        options.ForwardLimit = 1;
    });
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problem = new ValidationProblemDetails(context.ModelState)
            {
                Title = "Validation failed.",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://api.joviq.com/problems/validation_error",
                Instance = context.HttpContext.Request.Path
            };

            problem.Extensions["correlationId"] = context.HttpContext.TraceIdentifier;
            return new BadRequestObjectResult(problem);
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Joviq LMS API",
        Version = "v1",
        Description = "Joviq Technologies Website and LMS backend API."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
    {
        if (allowedOrigins.Length == 0)
        {
            if (!builder.Environment.IsDevelopment())
            {
                throw new InvalidOperationException("Cors:AllowedOrigins must be configured.");
            }

            policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .WithExposedHeaders("Retry-After")
                .AllowCredentials();
            return;
        }

        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("Retry-After")
            .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        var seconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
            ? Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds))
            : 60;
        context.HttpContext.Response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
        await Results.Problem(
            statusCode: StatusCodes.Status429TooManyRequests,
            title: "Too many attempts. Please wait before trying again.",
            detail: $"You can try again in {seconds} seconds.",
            extensions: new Dictionary<string, object?> { ["retryAfterSeconds"] = seconds }
        ).ExecuteAsync(context.HttpContext);
    };
    options.AddPolicy("AuthLogin", context =>
    {
        var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
    options.AddPolicy("AuthRegister", context =>
    {
        var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromHours(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
    // Checkout retries must not consume the hour-long registration allowance.
    options.AddPolicy("CheckoutAccount", context =>
    {
        var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var partitionKey = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
});

var app = builder.Build();

if (seedTestAccounts)
{
    await TestAccountSeeder.SeedAsync(app.Services);
    return;
}

if (initializeDatabase)
{
    await DatabaseInitializer.InitializeAsync(app.Services, runtimeConnectionString);
    return;
}

if (app.Environment.IsDevelopment())
{
    await RoleSeeder.SeedRolesAsync(app.Services);
    await LmsSeedData.SeedAsync(app.Services);
    await TestAccountSeeder.SeedAsync(app.Services);
}

if (builder.Configuration.GetValue<bool>("Hosting:AzureAppService")) app.UseForwardedHeaders();

app.UseApiMiddleware();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Joviq LMS API v1");
        options.RoutePrefix = "swagger";
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseCors("ReactClient");
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
app.MapGet("/", () => Results.Ok(new
{
    name = "Joviq LMS API",
    status = "running",
    version = "v1"
}));

app.Run();

public partial class Program;
