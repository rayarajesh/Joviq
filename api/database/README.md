# PostgreSQL Auth SQL Assets

Run EF Core migrations first so Identity and auth tables exist.

```bash
dotnet tool restore
dotnet tool run dotnet-ef migrations add InitialAuthSchema --project src/Joviq.Lms.Infrastructure --startup-project src/Joviq.Lms.Api
dotnet tool run dotnet-ef database update --project src/Joviq.Lms.Infrastructure --startup-project src/Joviq.Lms.Api
```

Then run the SQL scripts in this order:

```bash
psql -d Joviq -f database/stored-procedures/001_auth_create_audit_log.sql
psql -d Joviq -f database/stored-procedures/002_auth_revoke_user_sessions.sql
psql -d Joviq -f database/stored-procedures/003_auth_cleanup_expired_otps.sql
psql -d Joviq -f database/views/001_vw_active_user_sessions.sql
psql -d Joviq -f database/views/002_vw_user_auth_summary.sql
```

The scripts assume PostgreSQL has the `pgcrypto` extension available for `gen_random_uuid()`.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
