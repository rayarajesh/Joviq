# Joviq LMS API

Layered ASP.NET Core Web API for Joviq Technologies LMS.

## Projects

```text
src/Joviq.Lms.Api              HTTP controllers, middleware, startup
src/Joviq.Lms.Application      DTOs, interfaces, response models, contracts
src/Joviq.Lms.Domain           Entities and enums
src/Joviq.Lms.Infrastructure   EF Core, Identity, PostgreSQL, auth services
database                       Stored procedures and views
```

## Roles

Only these roles are used:

```text
Admin
Mentor
Student
```

## Run Backend

Install the .NET 10 SDK first, then from the `api` folder:

```bash
dotnet restore
dotnet tool restore
dotnet tool run dotnet-ef migrations add YourMigrationName --project src/Joviq.Lms.Infrastructure --startup-project src/Joviq.Lms.Api
dotnet tool run dotnet-ef database update --project src/Joviq.Lms.Infrastructure --startup-project src/Joviq.Lms.Api
dotnet run --project src/Joviq.Lms.Api
```

Swagger opens at:

```text
https://localhost:7001/swagger
```

## Google Sign-In

Create an OAuth 2.0 **Web application** in Google Cloud and add this exact authorized redirect URI:

```text
https://localhost:7001/signin-google
```

Keep credentials outside committed settings. For local development, set them with user secrets:

```bash
dotnet user-secrets set "ExternalAuth:Google:ClientId" "YOUR_CLIENT_ID" --project src/Joviq.Lms.Api
dotnet user-secrets set "ExternalAuth:Google:ClientSecret" "YOUR_CLIENT_SECRET" --project src/Joviq.Lms.Api
```

The client ID and secret must come from the same Google OAuth client. Restart the API after changing either value. If the local HTTPS certificate is not trusted, run `dotnet dev-certs https --trust` once.

## PostgreSQL

Default development connection:

```text
Host=localhost;Port=5432;Database=Joviq;Username=postgres;Password=s
```

Change it in `src/Joviq.Lms.Api/appsettings.Development.json`.

## Optional Admin Seed

To create the first admin automatically on startup, set:

```json
"SeedAdmin": {
  "Email": "admin@joviq.com",
  "Password": "s",
  "FullName": "Joviq Admin"
}
```
