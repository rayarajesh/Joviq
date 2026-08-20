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

## PostgreSQL

Default development connection:

```text
Host=localhost;Port=5432;Database=Joviq;Username=postgres;Password=CHANGE_ME
```

Change it in `src/Joviq.Lms.Api/appsettings.Development.json`.

## Optional Admin Seed

To create the first admin automatically on startup, set:

```json
"SeedAdmin": {
  "Email": "admin@joviq.com",
  "Password": "CHANGE_ME",
  "FullName": "Joviq Admin"
}
```
