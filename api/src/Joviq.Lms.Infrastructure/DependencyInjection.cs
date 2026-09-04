using System.Security.Claims;
using System.Text;
using Joviq.Lms.Application.Assets;
using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Application.Lms;
using Joviq.Lms.Application.Students;
using Joviq.Lms.Application.Users;
using Joviq.Lms.Infrastructure.Authentication;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Joviq.Lms.Infrastructure.Services.Assets;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Joviq.Lms.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<RefreshTokenOptions>(configuration.GetSection(RefreshTokenOptions.SectionName));
        services.Configure<OtpOptions>(configuration.GetSection(OtpOptions.SectionName));
        services.Configure<EmailSettingsOptions>(configuration.GetSection(EmailSettingsOptions.SectionName));
        services.Configure<ExternalAuthOptions>(configuration.GetSection(ExternalAuthOptions.SectionName));
        services.Configure<AssetStorageOptions>(configuration.GetSection(AssetStorageOptions.SectionName));

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=joviq_lms;Username=postgres;Password=s";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        services
            .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
                options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultEmailProvider;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

        var authenticationBuilder = services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.RequireHttpsMetadata = true;
                options.SaveToken = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = signingKey,
                    NameClaimType = "sub",
                    RoleClaimType = "role",
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        var externalAuthOptions = configuration.GetSection(ExternalAuthOptions.SectionName).Get<ExternalAuthOptions>() ?? new ExternalAuthOptions();
        if (!string.IsNullOrWhiteSpace(externalAuthOptions.Google.ClientId) &&
            !string.IsNullOrWhiteSpace(externalAuthOptions.Google.ClientSecret))
        {
            authenticationBuilder.AddGoogle("Google", options =>
            {
                options.ClientId = externalAuthOptions.Google.ClientId.Trim();
                options.ClientSecret = externalAuthOptions.Google.ClientSecret.Trim();
                options.CallbackPath = string.IsNullOrWhiteSpace(externalAuthOptions.Google.CallbackPath)
                    ? "/signin-google"
                    : externalAuthOptions.Google.CallbackPath.Trim();
                options.SignInScheme = IdentityConstants.ExternalScheme;
                options.SaveTokens = false;
                options.BackchannelHttpHandler = new GoogleOAuthBackchannelHandler(new SocketsHttpHandler
                {
                    ConnectTimeout = TimeSpan.FromSeconds(10),
                    PooledConnectionIdleTimeout = TimeSpan.FromSeconds(30),
                    PooledConnectionLifetime = TimeSpan.FromMinutes(3),
                    AutomaticDecompression = System.Net.DecompressionMethods.All
                });
                options.BackchannelTimeout = TimeSpan.FromSeconds(60);
                options.CorrelationCookie.HttpOnly = true;
                options.CorrelationCookie.IsEssential = true;
                options.CorrelationCookie.SameSite = SameSiteMode.None;
                options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
                options.ClaimActions.MapJsonKey("urn:google:picture", "picture", "url");
                options.ClaimActions.MapJsonKey("urn:google:email_verified", "email_verified", ClaimValueTypes.Boolean);
                options.Events.OnRemoteFailure = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("Joviq.GoogleOAuth");
                    logger.LogError(
                        context.Failure,
                        "Google OAuth remote callback failed for {Path}. CorrelationId: {CorrelationId}",
                        context.Request.Path,
                        context.HttpContext.TraceIdentifier);

                    var message = GetGoogleOAuthFailureMessage(context.Failure);
                    var redirectUrl = BuildGoogleOAuthFailureRedirect(
                        externalAuthOptions,
                        context.Properties,
                        message);

                    context.HandleResponse();
                    context.Response.Redirect(redirectUrl);
                    return Task.CompletedTask;
                };
            });
        }

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole(RoleNames.Admin));
            options.AddPolicy("StudentOnly", policy => policy.RequireRole(RoleNames.Student));
            options.AddPolicy("StudentOrAdmin", policy => policy.RequireRole(RoleNames.Student, RoleNames.Admin));
        });

        services.AddDataProtection();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAssetService, AssetService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<ILmsPortalService, LmsPortalService>();
        services.AddScoped<IStudentOnboardingService, StudentOnboardingService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddHostedService<AuditLogRetentionService>();

        var assetStorageOptions = configuration.GetSection(AssetStorageOptions.SectionName).Get<AssetStorageOptions>() ?? new AssetStorageOptions();
        if (assetStorageOptions.Provider.Equals("AwsS3", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IAssetStorageProvider, AwsS3AssetStorageProvider>();
        }
        else
        {
            services.AddSingleton<IAssetStorageProvider, LocalAssetStorageProvider>();
        }

        return services;
    }

    private static string GetGoogleOAuthFailureMessage(Exception? failure)
    {
        var details = GetExceptionMessages(failure).ToLowerInvariant();

        if (details.Contains("invalid_client") || details.Contains("unauthorized"))
        {
            return "Google sign-in configuration was rejected. Please verify the Google client ID and client secret.";
        }

        if (details.Contains("correlation") || details.Contains("state was missing") || details.Contains("state was invalid"))
        {
            return "The Google sign-in session expired or its cookie was blocked. Enable cookies and try again.";
        }

        if (details.Contains("access_denied") || details.Contains("access was denied"))
        {
            return "Google sign-in was cancelled.";
        }

        if (details.Contains("redirect_uri_mismatch"))
        {
            return "The Google sign-in redirect URL is not configured correctly.";
        }

        if (details.Contains("while sending the request") ||
            details.Contains("transport connection") ||
            details.Contains("forcibly closed") ||
            details.Contains("socketexception"))
        {
            return "Google sign-in hit a temporary connection problem. Please try again.";
        }

        return "Google sign-in could not be completed. Please try again.";
    }

    private static string GetExceptionMessages(Exception? exception)
    {
        var messages = new List<string>();
        while (exception is not null)
        {
            messages.Add(exception.Message);
            exception = exception.InnerException;
        }

        return string.Join(' ', messages);
    }

    private static string BuildGoogleOAuthFailureRedirect(
        ExternalAuthOptions options,
        AuthenticationProperties? properties,
        string message)
    {
        var callbackUrl = string.IsNullOrWhiteSpace(options.FrontendCallbackUrl)
            ? "http://localhost:5173/auth/google/callback"
            : options.FrontendCallbackUrl.Trim();
        var returnUrl = NormalizeOAuthReturnUrl(
            properties?.Items.TryGetValue("returnUrl", out var requestedReturnUrl) == true
                ? requestedReturnUrl
                : null);
        var separator = callbackUrl.Contains('?') ? '&' : '?';

        return $"{callbackUrl}{separator}returnUrl={Uri.EscapeDataString(returnUrl)}&error={Uri.EscapeDataString(message)}";
    }

    private static string NormalizeOAuthReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) ||
            !returnUrl.StartsWith('/') ||
            returnUrl.StartsWith("//") ||
            returnUrl.Contains('\r') ||
            returnUrl.Contains('\n'))
        {
            return "/dashboard";
        }

        return returnUrl;
    }
}
