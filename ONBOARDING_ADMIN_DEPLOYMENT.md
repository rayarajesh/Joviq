# Student onboarding administration

Open the main website as an admin, then choose **People > Student Onboarding**.
Local URL: http://localhost:5173/dashboard?section=Student%20Onboarding

## Behavior and changed files

- `web-single-page/src/components/EnrollmentDialog.tsx`: keeps the existing form and next step; uses the signed-in email, preserves entered data on failures, and records successful browser state only after the API saves.
- `api/src/Joviq.Lms.Infrastructure/Services/StudentOnboardingService.cs`: uses the existing authenticated registration endpoint and student profile, validates required details, and records submission time and `Submitted` review status. Repeat submissions update the same profile and return it to `Submitted`.
- `api/src/Joviq.Lms.Domain/Entities/StudentProfile.cs` and its persistence configuration: add nullable submission timestamp and review status, plus a submission-date index. The existing user-ID primary key prevents duplicate profiles.
- `api/src/Joviq.Lms.Application/Students/AdminOnboardingDtos.cs`, `Services/AdminOnboardingService.cs`, `Controllers/AdminOnboardingController.cs`, and dependency registration: provide paged/searchable/filterable lists, details, filter choices, and status updates. Queries join existing users for name/email and execute filtering and paging in PostgreSQL. Admin endpoints require the existing `AdminOnly` policy; student saves use the authenticated ID and `StudentOnly` policy.
- `web/src/components/AdminStudentOnboarding.tsx`, `web/src/styles/admin-onboarding.css`, and `web/src/pages/DashboardPage.tsx`: add the admin navigation entry, table, detail dialog, status editing, loading/empty/error states, retry, and mobile table scrolling.
- `api/tests/Joviq.Lms.Tests/OnboardingSubmissionTests.cs`: cover persistence, updates without duplicates, required-field validation, review status, querying, and controller authorization policies.

The review statuses are `Submitted`, `In Review`, `Approved`, and `Rejected`. These are separate from the existing account-setup onboarding enum, payment access, course completion, and certificates. Email is the existing authenticated user's email; this form does not change login credentials.

## Database migration

Apply `20261019140629_AddOnboardingReview` before starting the updated API. The migration and its designer update the EF model snapshot and add `OnboardingSubmittedAt`, `OnboardingReviewStatus`, and an index to `student_profiles`.

Existing profiles with a preferred program, start date, study year, and WhatsApp number are backfilled as `Submitted`. Their last profile update (or creation timestamp) is an **approximate historical submission date**; an exact registration timestamp was not previously stored. Newly saved submissions use the actual UTC save timestamp.

## Before Azure deployment

1. Back up the target database and review the migration/backfill.
2. Use the existing privileged migration connection, separate from the runtime connection, through the project's deployment initialization step (`dotnet Joviq.Lms.Api.dll --initialize`). Alternatively, use EF's `database update` with the infrastructure project and API startup project, configuring the migration credentials securely through the environment.
3. Deploy the updated API and main website, then the single pager. The API must see the migration before it starts querying profiles. Keep production test-account seeding and password resets disabled.
4. Sign in as a student and save the existing form. Verify the correct record in **Student Onboarding**, including college in **View details**, and change its review status.
5. Confirm an authenticated student receives `403` from `/api/v1/admin/onboarding` and anonymous access receives `401`.

No Azure deployment or email sending is performed by these changes. Local QA uses only designated test accounts.

## Validation

- Main website: TypeScript, Vite production build, prerender, and SEO verification.
- Single pager: TypeScript, Vite production build, and prerender.
- Real local PostgreSQL/API: submission and repeat update, linked user details, category/program/status/search filters, detail retrieval, review updates, validation errors, and ownership/role restrictions.
- Headless browser: admin login/navigation, searching/filtering, detail dialog, status updates, empty state, API error/retry, and mobile overflow checks.
- Full backend suite can be run with `TEST_POSTGRES_CONNECTION` pointing at a disposable isolated PostgreSQL instance. Never point this test setting at production or the working development database: the deployment test seeds catalog data and configures a test runtime role.

Existing dependency-audit warnings and frontend bundle-size warnings are separate from this feature.
