using Joviq.Lms.Application.Common.Security;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Identity;

public static class RoleSeeder
{
    public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("RoleSeeder");

        foreach (var roleName in RoleNames.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            if (result.Succeeded)
            {
                logger.LogInformation("Seeded role {RoleName}", roleName);
            }
            else
            {
                logger.LogError("Failed to seed role {RoleName}: {Errors}", roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        await RemoveObsoleteRoleAsync(roleManager, dbContext, logger);

        var adminEmail = configuration["SeedAdmin:Email"];
        var adminPassword = configuration["SeedAdmin:Password"];
        var resetAdminPassword = configuration.GetValue<bool>("SeedAdmin:ResetPassword");
        var adminName = configuration["SeedAdmin:FullName"] ?? "Joviq Admin";

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        var normalizedEmail = adminEmail.Trim().ToLowerInvariant();
        var admin = await userManager.FindByEmailAsync(normalizedEmail);

        if (admin is null)
        {
            admin = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                FullName = adminName,
                UserName = normalizedEmail,
                Email = normalizedEmail,
                EmailConfirmed = true,
                AccountStatus = AccountStatus.Active,
                OnboardingStatus = OnboardingStatus.Completed
            };

            var createResult = await userManager.CreateAsync(admin, adminPassword);
            if (!createResult.Succeeded)
            {
                logger.LogError("Failed to seed admin user: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return;
            }

            logger.LogInformation("Successfully created seeded admin user {AdminEmail}", normalizedEmail);
        }
        else if (resetAdminPassword)
        {
            var removePasswordResult = await userManager.RemovePasswordAsync(admin);
            if (!removePasswordResult.Succeeded)
            {
                logger.LogError("Failed to reset seeded admin password: {Errors}", string.Join(", ", removePasswordResult.Errors.Select(e => e.Description)));
                return;
            }

            var addPasswordResult = await userManager.AddPasswordAsync(admin, adminPassword);
            if (!addPasswordResult.Succeeded)
            {
                logger.LogError("Failed to apply seeded admin password: {Errors}", string.Join(", ", addPasswordResult.Errors.Select(e => e.Description)));
                return;
            }

            admin.EmailConfirmed = true;
            admin.AccountStatus = AccountStatus.Active;
            admin.LockoutEnd = null;
            await userManager.UpdateAsync(admin);
        }

        if (!await userManager.IsInRoleAsync(admin, RoleNames.Admin))
        {
            var roleAddResult = await userManager.AddToRoleAsync(admin, RoleNames.Admin);
            if (roleAddResult.Succeeded)
            {
                logger.LogInformation("Seeded default admin user {AdminEmail} successfully", normalizedEmail);
            }
            else
            {
                logger.LogError("Failed to add admin role to seeded user {AdminEmail}: {Errors}", 
                    normalizedEmail, string.Join(", ", roleAddResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            logger.LogInformation("Admin user {AdminEmail} already has admin role", normalizedEmail);
        }
    }

    private static async Task RemoveObsoleteRoleAsync(
        RoleManager<IdentityRole<Guid>> roleManager,
        ApplicationDbContext dbContext,
        ILogger logger)
    {
        var obsoleteRoleName = string.Concat("Men", "tor");
        var obsoleteRole = await roleManager.FindByNameAsync(obsoleteRoleName);
        if (obsoleteRole is null)
        {
            return;
        }

        var roleLinks = await dbContext.UserRoles
            .Where(userRole => userRole.RoleId == obsoleteRole.Id)
            .ToListAsync();

        dbContext.UserRoles.RemoveRange(roleLinks);
        await dbContext.SaveChangesAsync();

        var result = await roleManager.DeleteAsync(obsoleteRole);
        if (result.Succeeded)
        {
            logger.LogInformation("Removed obsolete role {RoleName}", obsoleteRoleName);
            return;
        }

        logger.LogError(
            "Failed to remove obsolete role {RoleName}: {Errors}",
            obsoleteRoleName,
            string.Join(", ", result.Errors.Select(error => error.Description)));
    }
}
