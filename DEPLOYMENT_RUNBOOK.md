# Joviq Deployment Runbook

## Accounts and Environments

GitHub repository: `rayarajesh/Joviq`.
Azure subscription: `Azure subscription 1` (`967bdbb5-a7f7-4923-9ea1-d6ecc1ebd33f`).
Alert recipient: `joviqtechnologies@gmail.com`.

Frontend URLs: [production](https://icy-dune-05c1e1d00.4.azurestaticapps.net) and [dev](https://salmon-river-019f1cc00.5.azurestaticapps.net).
API origins: `https://joviq-production-att374savogto-api.azurewebsites.net` and `https://joviq-dev-ru6cvhzsck7os-api.azurewebsites.net`.
The initial administrator is `joviqtechnologies@gmail.com`; its generated password is the `seed-admin-password` secret in each environment's Key Vault. Do not put that password in source control or chat.

The low-cost default is Linux App Service B1, PostgreSQL Burstable B1ms (32 GB), Static Web Apps Free, and locally redundant Blob Storage. Separate dev and production resource groups isolate data. There is no high availability or production hosting SLA implied by this configuration. API deployments on B1 can cause brief downtime. Stopping an app does not stop App Service plan billing.

The subscription is currently a free trial with its spending limit enabled. Bootstrap does not remove that limit or upgrade the subscription. Budget alerts are configured at 150 units of the subscription's billing currency; this is an initial alert threshold, not a cost estimate or spending cap. Confirm a suitable value in Cost Management or `MONTHLY_BUDGET` before removing the trial spending limit.

Azure reported the budget currency as INR on October 1, 2026. At the queried Central India retail rates, B1 Linux compute (INR 1.7278/hour), PostgreSQL B1ms (INR 2.3517/hour), and 32 GB database storage (INR 12.5746/GB/month) total approximately INR 3,380 per environment at 730 hours/month, or INR 6,760 for both. This excludes Blob usage, Key Vault, monitoring, backups beyond the included allowance, transfer, taxes, and trial discounts. INR retail rates are reference estimates, not a billing quote. The INR 150 alert is deliberately early and does not make the deployment cost INR 150/month. See [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices).

## First Provisioning or Recovery

Prerequisites: Azure CLI, GitHub CLI, Node 24, .NET 10, and Bicep. On this Mac, Homebrew's .NET 10 executable is `/opt/homebrew/bin/dotnet`; the older `/usr/local/share/dotnet` executable can shadow it.

```bash
gh auth login --hostname github.com --git-protocol https --web
az login --tenant e2f72a5f-558b-42ae-8a6b-73c491163013
node scripts/bootstrap-azure.mjs dev
node scripts/bootstrap-azure.mjs dev --apply
node scripts/bootstrap-azure.mjs production
node scripts/bootstrap-azure.mjs production --apply
```

Without `--apply`, bootstrap configures identities/GitHub settings and previews the resource deployment. With `--apply`, it provisions resources, configures deployment permissions, and stores the Static Web Apps token in the corresponding GitHub environment.

Bootstrap generates credentials once and retains them in `.deploy-state/<environment>.json`, with owner-only filesystem permissions. This directory is ignored by Git. Do not delete it during an incomplete deployment; it permits a retry without rotating database credentials. Azure Key Vault holds deployed secrets and GitHub environment secrets hold the secure infrastructure inputs. Back up local bootstrap state securely; do not commit or share it.

OIDC trust reads GitHub's current `sub_claim_prefix`, including immutable owner/repository IDs. `node scripts/bootstrap-azure.mjs <environment> --trust-only` repairs account/environment trust without deploying infrastructure. See [GitHub OIDC subject documentation](https://docs.github.com/en/actions/reference/security/oidc).

If provisioning fails, inspect `az deployment group show` and `az deployment operation group list` for the environment. Retry with the same bootstrap state. Do not remove the spending limit or switch regions silently to resolve quota failures.

## Pipeline Behavior

- `CI`: runs on pull requests and pushes to main; frontend checks/build, backend tests against disposable PostgreSQL, Bicep validation, and API packaging.
- `Deploy`: successful main-branch CI deploys to dev. Manual dispatch can deploy a specified successful main commit to production, using the API artifact from that CI run.
- `Infrastructure`: manually preview or apply Bicep changes to an environment using a separate OIDC identity.
- `Rollback`: restores the API and matching frontend artifacts for a previous compatible production release. It does not reverse database migrations.

Production uses a required GitHub environment reviewer. For a single-owner repository, self-review is allowed; deployments still wait for an explicit review action. Artifacts are retained for 30 days. Releases older than retained artifacts must be rebuilt and revalidated.

The main branch requires pull requests and successful `frontend`, `backend`, and `infrastructure` checks, including for administrators. It blocks force pushes and deletion. A second approving reviewer is not required for this single-owner repository.

The API artifact is built once in CI. Vite embeds `VITE_API_BASE_URL`, so frontend artifacts are built for each environment from the selected commit. Application, infrastructure, and rollback workflows use the same environment concurrency group to prevent overlapping releases.

## Database Initialization

The published API includes a manually triggered `initialize` WebJob. Infrastructure explicitly enables `webJobsEnabled` and the Linux Kudu agent. The release workflow deploys the package, triggers the job through Azure Resource Manager, waits for its own run to succeed, and checks health before proceeding.

The job runs `dotnet Joviq.Lms.Api.dll --initialize` on App Service, so it can reach the private PostgreSQL server without a separate migration VM or a publicly open database. It applies EF migrations, initializes identity roles/admin, optionally seeds the dev catalog, and grants the runtime role data access without schema privileges. Production does not automatically populate sample lesson/catalog data.

The hosting identity and WebJob share the App Service host and Key Vault access. Runtime SQL connections use the restricted user, but the host can also obtain the migration credential. For stronger separation, move initialization to a dedicated job/identity before a higher-assurance production rollout.

Use additive/backward-compatible migrations. Slots and artifact rollback do not undo schema changes. PostgreSQL PITR creates a new server; recovery requires changing connection settings and validating the restored application.

## External Integrations

Infrastructure deployment does not supply SMTP, Google OAuth, or Cashfree/Razorpay credentials. Registration/password-reset email, Google sign-in, and paid checkout are not ready until these are configured and tested. The seeded admin can authenticate without registration email.

Use `scripts/configure-integrations.mjs` with a private JSON file under `.deploy-state/`. It uploads secrets to Key Vault and sets only Key Vault references in App Service/GitHub configuration. Example structure, with placeholders:

```json
{
  "secrets": {
    "smtp-password": "YOUR_SMTP_APP_PASSWORD",
    "google-client-secret": "YOUR_GOOGLE_CLIENT_SECRET",
    "payment-key-secret": "YOUR_PAYMENT_SECRET",
    "payment-webhook-secret": "YOUR_WEBHOOK_SECRET"
  },
  "settings": [
    { "name": "EmailSettings__SmtpServer", "value": "smtp.gmail.com" },
    { "name": "EmailSettings__Port", "value": "587" },
    { "name": "EmailSettings__SenderEmail", "value": "joviqtechnologies@gmail.com" },
    { "name": "EmailSettings__Username", "value": "joviqtechnologies@gmail.com" },
    { "name": "EmailSettings__Password", "value": "@Microsoft.KeyVault(SecretUri=https://YOUR-VAULT.vault.azure.net/secrets/smtp-password)" },
    { "name": "ExternalAuth__Google__ClientId", "value": "YOUR_GOOGLE_CLIENT_ID" },
    { "name": "ExternalAuth__Google__ClientSecret", "value": "@Microsoft.KeyVault(SecretUri=https://YOUR-VAULT.vault.azure.net/secrets/google-client-secret)" },
    { "name": "Payments__Provider", "value": "Cashfree" },
    { "name": "Payments__KeyId", "value": "YOUR_PAYMENT_KEY_ID" },
    { "name": "Payments__KeySecret", "value": "@Microsoft.KeyVault(SecretUri=https://YOUR-VAULT.vault.azure.net/secrets/payment-key-secret)" },
    { "name": "Payments__WebhookSecret", "value": "@Microsoft.KeyVault(SecretUri=https://YOUR-VAULT.vault.azure.net/secrets/payment-webhook-secret)" }
  ]
}
```

```bash
node scripts/configure-integrations.mjs dev .deploy-state/integrations-dev.json
node scripts/configure-integrations.mjs production .deploy-state/integrations-production.json
```

Omit unused integrations and configure sandbox keys in dev. Set the Google authorized redirect URI to `<API_ORIGIN>/signin-google`; register the actual payment webhook URLs with the chosen gateway. A Gmail account password is not an SMTP app password. Do not put credentials in chat, source files, or frontend `VITE_*` variables.

The script also persists nonsecret settings/Key Vault references in `AZURE_INTEGRATION_SETTINGS` so infrastructure reapplication and local bootstrap preserve them.

## Domains, Storage, and Launch Checks

The owned production frontend domain is `joviqtechnologies.com`, with `www.joviqtechnologies.com` as an additional origin. GoDaddy DNS uses Azure's stable inbound IP `20.239.34.78` for `A @`, an Azure ownership-verification TXT at `@`, and a `www` CNAME to `icy-dune-05c1e1d00.4.azurestaticapps.net`. All three records were saved on October 1, 2026. Both hostnames are registered in Azure; domain validation/TLS must complete before either hostname is considered live. Preserve the Google MX, SPF, DKIM, verification and DMARC records.

The production GitHub environment stores `FRONTEND_ORIGIN=https://joviqtechnologies.com` and `ADDITIONAL_FRONTEND_ORIGINS=["https://www.joviqtechnologies.com"]`. The infrastructure keeps the built-in Azure frontend allowed alongside custom origins for API and Blob CORS. Before public launch, configure an owned API domain, verify TLS, OAuth callbacks and provider URLs. Using sibling frontend/API subdomains avoids refresh-cookie problems caused by browser third-party-cookie policies on separate Azure domains. Do not assume an `api` DNS record or custom API certificate is configured yet.

Blob containers are private, but the storage network endpoint is public for browser uploads and downloads using short-lived SAS URLs. Upload SAS permits creation of one blob without overwrite; completion checks declared size/content type. Private reads require API authorization. Public thumbnails use stable API URLs that redirect to short-lived signed Blob URLs only after verifying public visibility and ready status. Old local/S3 files are not transferred automatically.

Readiness: `/health/ready`; liveness: `/health/live`. API server errors and unhealthy instances alert the configured recipient. PostgreSQL backups retain 7 days in dev and 14 days in production; Blob versioning and soft delete are enabled. Monitoring ingestion has a small daily quota; quotas and budgets are not strict billing caps.

Before accepting live users: verify real registration/reset email, Google OAuth if enabled, refresh-cookie behavior, private lesson authorization, direct media upload/download, production payment callbacks, a compatible artifact rollback, and a PostgreSQL restore drill. Load real production course/catalog data and transfer existing files/data separately if required.

## Local Verification

```bash
npm --prefix web ci
npm --prefix web run build
dotnet build api/Joviq.Lms.sln --configuration Release
dotnet test api/tests/Joviq.Lms.Tests --configuration Release
node --test scripts/tests/*.test.mjs
az bicep build --file infra/main.bicep --outfile /tmp/joviq-main.json
actionlint
shellcheck scripts/*.sh api/deployment/run.sh
```

Backend integration tests require `TEST_POSTGRES_CONNECTION` pointing to a disposable database whose test administrator can create roles and extensions. The tests apply migrations and create the `joviq_app` role; never run them against production. Local development also requires real configuration through user secrets or ignored local settings; production credentials have no checked-in fallback.
