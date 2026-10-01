using Joviq.Lms.Api.Services;
using Joviq.Lms.Infrastructure;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Npgsql;

namespace Joviq.Lms.Tests;

public class DeploymentTests
{
    private static Dictionary<string, string?> Settings() => new()
    {
        ["ConnectionStrings:DefaultConnection"] = "Host=database.postgres.database.azure.com;Database=joviq;Username=joviq_app;Password=test-only;SSL Mode=VerifyFull",
        ["Jwt:SigningKey"] = new string('x', 64),
        ["Cors:AllowedOrigins:0"] = "https://app.example.com",
        ["Assets:Provider"] = "AzureBlob",
        ["DataProtection:BlobUri"] = "https://storage.blob.core.windows.net/system/keys.xml",
        ["DataProtection:KeyIdentifier"] = "https://vault.vault.azure.net/keys/data-protection"
    };

    [Fact]
    public void AcceptsSecureDeploymentConfiguration() =>
        DeploymentConfiguration.Validate(new ConfigurationBuilder().AddInMemoryCollection(Settings()).Build(), new ProductionEnvironment());

    [Theory]
    [InlineData("Jwt:SigningKey", "LOCAL_DEVELOPMENT_ONLY_JOVIQ_LMS_SIGNING_KEY_64_CHARS_1234567890")]
    [InlineData("Jwt:SigningKey", "@Microsoft.KeyVault(SecretUri=https://vault.vault.azure.net/secrets/key)")]
    [InlineData("ConnectionStrings:DefaultConnection", "Host=localhost;Database=joviq;SSL Mode=VerifyFull")]
    [InlineData("ConnectionStrings:DefaultConnection", "Host=db.example.com;Database=joviq;SSL Mode=Require")]
    [InlineData("Cors:AllowedOrigins:0", "http://app.example.com")]
    [InlineData("Cors:AllowedOrigins:0", "https://localhost")]
    [InlineData("Assets:Provider", "Local")]
    [InlineData("DataProtection:BlobUri", "")]
    [InlineData("SeedAdmin:ResetPassword", "true")]
    public void RejectsUnsafeDeploymentConfiguration(string key, string value)
    {
        var settings = Settings();
        settings[key] = value;
        Assert.Throws<InvalidOperationException>(() => DeploymentConfiguration.Validate(
            new ConfigurationBuilder().AddInMemoryCollection(settings).Build(), new ProductionEnvironment()));
    }

    [Fact]
    public async Task MigrationsAreRepeatableAndRuntimeCannotChangeSchema()
    {
        var connectionString = Environment.GetEnvironmentVariable("TEST_POSTGRES_CONNECTION");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Set TEST_POSTGRES_CONNECTION to a disposable PostgreSQL database to run integration tests.");

        var settings = Settings();
        settings["ConnectionStrings:DefaultConnection"] = connectionString;
        settings.Remove("DataProtection:BlobUri");
        settings["Assets:Provider"] = "Local";
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        using var services = new ServiceCollection().AddLogging().AddSingleton<IConfiguration>(configuration)
            .AddInfrastructure(configuration)
            .BuildServiceProvider();
        var runtime = new NpgsqlConnectionStringBuilder(connectionString)
        {
            Username = "joviq_app", Password = "ci-only-runtime-password"
        };
        await DatabaseInitializer.InitializeAsync(services, runtime.ConnectionString);
        await DatabaseInitializer.InitializeAsync(services, runtime.ConnectionString);
        await using var connection = new NpgsqlConnection(runtime.ConnectionString);
        await connection.OpenAsync();
        await using var read = new NpgsqlCommand("SELECT COUNT(*) FROM \"AspNetRoles\"", connection);
        Assert.True(Convert.ToInt64(await read.ExecuteScalarAsync()) > 0);
        await using var ddl = new NpgsqlCommand("CREATE TABLE runtime_must_not_create(id int)", connection);
        var error = await Assert.ThrowsAsync<PostgresException>(() => ddl.ExecuteNonQueryAsync());
        Assert.Equal("42501", error.SqlState);
    }

    private sealed class ProductionEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Production";
        public string ApplicationName { get; set; } = "Joviq.Lms.Api";
        public string ContentRootPath { get; set; } = ".";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
