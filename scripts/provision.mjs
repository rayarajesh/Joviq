import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function integrations(value = '[]') {
  const settings = JSON.parse(value || '[]');
  const allowed = /^(EmailSettings__(SmtpServer|Port|SenderName|SenderEmail|Username|Password)|ExternalAuth__Google__(ClientId|ClientSecret)|Payments__(Provider|KeyId|KeySecret|WebhookSecret|CashfreeEnvironment|Environment))$/;
  if (!Array.isArray(settings) || settings.some(setting => !allowed.test(setting.name) || typeof setting.value !== 'string'))
    throw new Error('Invalid integration settings');
  for (const setting of settings) {
    if (/__(Password|ClientSecret|KeySecret|WebhookSecret)$/.test(setting.name) &&
        !/^@Microsoft\.KeyVault\(SecretUri=https:\/\/[a-z0-9-]+\.vault\.azure\.net\/secrets\/[a-z0-9-]+\)$/.test(setting.value))
      throw new Error('Integration secrets must use versionless Azure Key Vault references');
  }
  return settings;
}

export function parameters(env) {
  if (!['dev', 'production'].includes(env.DEPLOY_ENVIRONMENT)) throw new Error('Invalid deployment environment');
  for (const name of ['POSTGRES_ADMIN_PASSWORD', 'POSTGRES_RUNTIME_PASSWORD', 'JWT_SIGNING_KEY']) {
    if (!env[name] || !/^[A-Za-z0-9_-]{32,}$/.test(env[name]))
      throw new Error(`${name} must be at least 32 URL-safe characters`);
  }
  const budget = Number(env.MONTHLY_BUDGET || 150);
  if (!Number.isFinite(budget) || budget <= 0) throw new Error('Invalid budget');
  const additionalOrigins = JSON.parse(env.ADDITIONAL_FRONTEND_ORIGINS || '[]');
  const validOrigin = value => {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.origin === value && !url.username && !url.password;
    } catch { return false; }
  };
  if (!Array.isArray(additionalOrigins) || additionalOrigins.length > 4 || additionalOrigins.some(value => !validOrigin(value)))
    throw new Error('Additional frontend origins must be up to four exact HTTPS origins');
  if (env.FRONTEND_ORIGIN && !validOrigin(env.FRONTEND_ORIGIN)) throw new Error('Invalid frontend origin');
  return Object.fromEntries(Object.entries({
    environment: env.DEPLOY_ENVIRONMENT,
    location: env.AZURE_LOCATION || 'centralindia',
    staticLocation: env.AZURE_STATIC_LOCATION || 'eastasia',
    enableReleaseSlot: env.AZURE_USE_RELEASE_SLOT === 'true',
    staticWebAppSku: env.AZURE_STATIC_SKU || 'Free',
    postgresAdminPassword: env.POSTGRES_ADMIN_PASSWORD,
    postgresRuntimePassword: env.POSTGRES_RUNTIME_PASSWORD,
    jwtSigningKey: env.JWT_SIGNING_KEY,
    seedAdminPassword: env.SEED_ADMIN_PASSWORD || '',
    seedAdminEmail: env.SEED_ADMIN_EMAIL || '',
    frontendOrigin: env.FRONTEND_ORIGIN || '',
    additionalFrontendOrigins: additionalOrigins,
    alertEmail: env.ALERT_EMAIL || '',
    monthlyBudget: budget,
    budgetStartDate: env.AZURE_BUDGET_START_DATE || new Date().toISOString().slice(0, 7) + '-01',
    integrationSettings: integrations(env.AZURE_INTEGRATION_SETTINGS)
  }).map(([name, value]) => [name, { value }]));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const values = parameters(process.env);
  if (!process.env.AZURE_RESOURCE_GROUP) throw new Error('AZURE_RESOURCE_GROUP is required');
  const operation = process.env.DEPLOY_OPERATION || 'preview';
  if (!['preview', 'apply'].includes(operation)) throw new Error('Invalid operation');
  const directory = mkdtempSync(join(tmpdir(), 'joviq-provision-'));
  try {
    const path = join(directory, 'parameters.json');
    writeFileSync(path, JSON.stringify({ parameters: values }), { mode: 0o600 });
    const result = spawnSync('az', [
      'deployment', 'group', operation === 'apply' ? 'create' : 'what-if',
      '--name', `joviq-${process.env.DEPLOY_ENVIRONMENT}`,
      '--resource-group', process.env.AZURE_RESOURCE_GROUP,
      '--template-file', 'infra/main.bicep', '--parameters', `@${path}`,
      ...(operation === 'apply' ? ['--query', 'properties.outputs', '--output', 'json'] : [])
    ], { stdio: 'inherit' });
    if (result.status !== 0) process.exitCode = result.status || 1;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
