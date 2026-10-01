using Npgsql;

namespace Joviq.Lms.Api.Services;

public static class DeploymentConfiguration
{
    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        if (environment.IsDevelopment()) return;

        var signingKey = configuration["Jwt:SigningKey"];
        if (string.IsNullOrWhiteSpace(signingKey) || signingKey.Length < 32 ||
            signingKey.StartsWith("@Microsoft.KeyVault", StringComparison.OrdinalIgnoreCase) ||
            signingKey.Contains("LOCAL_DEVELOPMENT", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("A production JWT signing key of at least 32 characters is required.");

        var connection = new NpgsqlConnectionStringBuilder(configuration.GetConnectionString("DefaultConnection"));
        if (connection.Host is "localhost" or "127.0.0.1" || connection.SslMode != SslMode.VerifyFull)
            throw new InvalidOperationException("Deployment requires PostgreSQL TLS with certificate verification.");

        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (origins.Length == 0 || origins.Any(origin =>
            !Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme != "https" || uri.IsLoopback))
            throw new InvalidOperationException("Deployment requires explicit HTTPS frontend origins.");

        if (configuration["Assets:Provider"] != "AzureBlob" ||
            string.IsNullOrWhiteSpace(configuration["DataProtection:BlobUri"]) ||
            string.IsNullOrWhiteSpace(configuration["DataProtection:KeyIdentifier"]))
            throw new InvalidOperationException("Deployment requires Azure Blob Storage and persistent protected keys.");

        if (configuration.GetValue<bool>("SeedAdmin:ResetPassword"))
            throw new InvalidOperationException("Automatic administrator password resets are disabled in deployed environments.");
    }
}
