using System.Security.Claims;
using System.Text;
using Joviq.Lms.Application.Auth;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Application.Lms;
using Joviq.Lms.Application.Students;
using Joviq.Lms.Application.Users;
using Joviq.Lms.Infrastructure.Identity;
using Joviq.Lms.Infrastructure.Persistence;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=joviq_lms;Username=postgres;Password=postgres";

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
                options.ClientId = externalAuthOptions.Google.ClientId;
                options.ClientSecret = externalAuthOptions.Google.ClientSecret;
                options.CallbackPath = externalAuthOptions.Google.CallbackPath;
                options.SignInScheme = IdentityConstants.ExternalScheme;
                options.SaveTokens = false;
                options.ClaimActions.MapJsonKey("urn:google:picture", "picture", "url");
                options.ClaimActions.MapJsonKey("urn:google:email_verified", "email_verified", ClaimValueTypes.Boolean);
            });
        }

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole(RoleNames.Admin));
            options.AddPolicy("MentorOnly", policy => policy.RequireRole(RoleNames.Mentor));
            options.AddPolicy("StudentOnly", policy => policy.RequireRole(RoleNames.Student));
            options.AddPolicy("MentorOrAdmin", policy => policy.RequireRole(RoleNames.Mentor, RoleNames.Admin));
            options.AddPolicy("StudentOrAdmin", policy => policy.RequireRole(RoleNames.Student, RoleNames.Admin));
        });

        services.AddDataProtection();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<ILmsPortalService, LmsPortalService>();
        services.AddScoped<IStudentOnboardingService, StudentOnboardingService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<ISmsSender, NoOpSmsSender>();
        services.AddHostedService<AuditLogRetentionService>();

        return services;
    }
}
