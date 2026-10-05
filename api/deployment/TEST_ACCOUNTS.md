# Seeded test accounts

The real administrator continues to use `SeedAdmin:Email` and its existing secret password.
The test accounts are separate:

- Administrator: `testadminjoviq@gmail.com`
- Student: `teststudentjoviq@gmail.com`

Supply passwords using secret configuration, never committed application settings:

```text
TestAccounts__Enabled=true
TestAccounts__AdminPassword=<secret reference>
TestAccounts__StudentPassword=<secret reference>
TestAccounts__ResetPasswords=false
```

Run the published API with `--seed-test-accounts` from a host that can reach the database.
This command does not apply migrations, start the web server, or reset the real administrator.
Initialization also runs the opt-in seed after the course catalog is available.

The designated student receives one Data Science Launch (`SELF`) enrollment with a full
course-fee waiver, no payment transaction, and six months of access. Rerunning does not
duplicate the enrollment or extend access. Existing paid or different enrollments and
unexpected account roles cause the operation to stop rather than replace them.

For private Azure databases, run an isolated triggered WebJob using `seed-test-accounts.sh`
as `run.sh`. Package compiled assemblies and runtime dependencies only; exclude
`appsettings*.json`. Upload only to the job's own directory, without cleaning `wwwroot`,
and never invoke the migration initialization job for this operation.

Test accounts in production have real privileges. Change their passwords and disable
test-account seeding after testing. Password replacement on a later seed requires the
explicit `TestAccounts__ResetPasswords` setting.
