using Joviq.Lms.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Joviq.Lms.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, string runtimeConnectionString)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        await db.Database.MigrateAsync();
        await RoleSeeder.SeedRolesAsync(services);
        if (configuration.GetValue<bool>("Database:SeedCatalog"))
            await LmsSeedData.SeedAsync(services);

        var runtime = new NpgsqlConnectionStringBuilder(runtimeConnectionString);
        var migration = new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString());
        if (runtime.Username == migration.Username || runtime.Database != migration.Database || runtime.Host != migration.Host)
            throw new InvalidOperationException("Runtime and migration connections must use separate users on the same database.");

        await using var connection = new NpgsqlConnection(migration.ConnectionString);
        await connection.OpenAsync();
        // PostgreSQL format quotes identifiers and password literals; never concatenate raw credentials into SQL.
        await using var roleCommand = new NpgsqlCommand("""
            SELECT format(
                CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = @role)
                    THEN 'ALTER ROLE %I LOGIN PASSWORD %L'
                    ELSE 'CREATE ROLE %I LOGIN PASSWORD %L' END,
                @role, @password)
            """, connection);
        roleCommand.Parameters.AddWithValue("role", runtime.Username ?? throw new InvalidOperationException("Runtime username is required."));
        roleCommand.Parameters.AddWithValue("password", runtime.Password ?? throw new InvalidOperationException("Runtime password is required."));
        var sql = (string)(await roleCommand.ExecuteScalarAsync())!;
        await using var createRole = new NpgsqlCommand(sql, connection);
        await createRole.ExecuteNonQueryAsync();

        var quoting = new NpgsqlCommandBuilder();
        var role = quoting.QuoteIdentifier(runtime.Username!);
        var database = quoting.QuoteIdentifier(runtime.Database!);
        await using var grant = new NpgsqlCommand($"""
            GRANT CONNECT ON DATABASE {database} TO {role};
            GRANT USAGE ON SCHEMA public TO {role};
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {role};
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {role};
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {role};
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO {role};
            """, connection);
        await grant.ExecuteNonQueryAsync();
    }
}
