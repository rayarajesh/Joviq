import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const environment = process.argv[2];
if (!['dev', 'production'].includes(environment)) throw new Error('Usage: node scripts/bootstrap-azure.mjs dev|production [--apply]');
const repo = 'rayarajesh/Joviq';
const directory = '.deploy-state';
mkdirSync(directory, { recursive: true, mode: 0o700 });
const statePath = join(directory, `${environment}.json`);
const temporary = mkdtempSync(join(tmpdir(), 'joviq-bootstrap-'));

function run(tool, args, input) {
  const result = spawnSync(tool, args, { encoding: 'utf8', input });
  if (result.status !== 0) throw new Error(`${tool} ${args.slice(0, 3).join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}
const az = (...args) => run('az', [...args, '--only-show-errors', '--output', 'json']);
const json = (...args) => JSON.parse(az(...args));
const gh = (...args) => run('gh', args);
function save(state) { writeFileSync(statePath, JSON.stringify(state, null, 2), { mode: 0o600 }); }
function file(name, value) {
  const path = join(temporary, name);
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  return path;
}
function variable(name, value) {
  gh('variable', 'set', name, '--repo', repo, '--env', environment, '--body', String(value));
}
function secret(name, value) {
  run('gh', ['secret', 'set', name, '--repo', repo, '--env', environment], value);
}

try {
  const account = json('account', 'show');
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {
    subscriptionId: account.id,
    resourceGroup: `joviq-${environment}`,
    location: process.env.AZURE_LOCATION || 'centralindia',
    postgresAdminPassword: randomBytes(36).toString('base64url'),
    postgresRuntimePassword: randomBytes(36).toString('base64url'),
    jwtSigningKey: randomBytes(48).toString('base64url'),
    seedAdminPassword: `${randomBytes(24).toString('base64url')}!Aa1`,
    seedAdminEmail: 'joviqtechnologies@gmail.com'
  };
  if (state.subscriptionId !== account.id) throw new Error('Saved state belongs to a different Azure subscription');
  state.budgetStartDate ??= new Date().toISOString().slice(0, 7) + '-01';
  save(state);
  json('group', 'create', '--name', state.resourceGroup, '--location', state.location, '--tags', 'application=joviq', `environment=${environment}`);
  gh('api', '--method', 'PUT', `repos/${repo}/environments/${environment}`, '--input', file('environment.json', {
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
    ...(environment === 'production' ? { reviewers: [{ type: 'User', id: JSON.parse(gh('api', 'users/rayarajesh')).id }], prevent_self_review: false } : {})
  }));
  const policies = JSON.parse(gh('api', `repos/${repo}/environments/${environment}/deployment-branch-policies`));
  if (!policies.branch_policies.some(policy => policy.name === 'main'))
    gh('api', '--method', 'POST', `repos/${repo}/environments/${environment}/deployment-branch-policies`, '--input', file('branch.json', { name: 'main', type: 'branch' }));
  const existingVariables = JSON.parse(gh('variable', 'list', '--repo', repo, '--env', environment, '--json', 'name,value'));
  const existingValue = name => existingVariables.find(variable => variable.name === name)?.value;

  const scope = `/subscriptions/${account.id}/resourceGroups/${state.resourceGroup}`;
  for (const purpose of ['infra', 'deploy']) {
    state.identities ??= {};
    if (!state.identities[purpose]) {
      const app = json('ad', 'app', 'create', '--display-name', `joviq-${environment}-${purpose}-github`);
      const sp = json('ad', 'sp', 'create', '--id', app.appId);
      state.identities[purpose] = { appId: app.appId, objectId: app.id, principalId: sp.id };
      save(state);
    }
    const identity = state.identities[purpose];
    const credentials = json('ad', 'app', 'federated-credential', 'list', '--id', identity.objectId);
    if (!credentials.some(credential => credential.name === 'github-environment'))
      json('ad', 'app', 'federated-credential', 'create', '--id', identity.objectId, '--parameters', file(`${purpose}-oidc.json`, {
        name: 'github-environment', issuer: 'https://token.actions.githubusercontent.com',
        subject: `repo:${repo}:environment:${environment}`, audiences: ['api://AzureADTokenExchange']
      }));
    if (purpose === 'infra') {
      for (const role of ['Contributor', 'User Access Administrator'])
        json('role', 'assignment', 'create', '--assignee-object-id', identity.principalId, '--assignee-principal-type', 'ServicePrincipal', '--role', role, '--scope', scope);
    }
    variable(purpose === 'infra' ? 'AZURE_INFRA_CLIENT_ID' : 'AZURE_CLIENT_ID', identity.appId);
  }
  for (const [name, value] of Object.entries({
    AZURE_SUBSCRIPTION_ID: account.id, AZURE_TENANT_ID: account.tenantId,
    AZURE_RESOURCE_GROUP: state.resourceGroup, ALERT_EMAIL: 'joviqtechnologies@gmail.com',
    SEED_ADMIN_EMAIL: state.seedAdminEmail, MONTHLY_BUDGET: process.env.MONTHLY_BUDGET || existingValue('MONTHLY_BUDGET') || '150',
    AZURE_BUDGET_START_DATE: state.budgetStartDate,
    AZURE_LOCATION: state.location, AZURE_STATIC_LOCATION: 'eastasia', AZURE_USE_RELEASE_SLOT: 'false'
  })) variable(name, value);
  for (const [name, value] of Object.entries({
    POSTGRES_ADMIN_PASSWORD: state.postgresAdminPassword, POSTGRES_RUNTIME_PASSWORD: state.postgresRuntimePassword,
    JWT_SIGNING_KEY: state.jwtSigningKey, SEED_ADMIN_PASSWORD: state.seedAdminPassword
  })) secret(name, value);

  const result = spawnSync(process.execPath, ['scripts/provision.mjs'], {
    stdio: 'inherit', env: {
      ...process.env, AZURE_RESOURCE_GROUP: state.resourceGroup, AZURE_LOCATION: state.location,
      DEPLOY_ENVIRONMENT: environment, DEPLOY_OPERATION: process.argv.includes('--apply') ? 'apply' : 'preview',
      POSTGRES_ADMIN_PASSWORD: state.postgresAdminPassword, POSTGRES_RUNTIME_PASSWORD: state.postgresRuntimePassword,
      JWT_SIGNING_KEY: state.jwtSigningKey, SEED_ADMIN_PASSWORD: state.seedAdminPassword,
      SEED_ADMIN_EMAIL: state.seedAdminEmail, ALERT_EMAIL: 'joviqtechnologies@gmail.com',
      MONTHLY_BUDGET: process.env.MONTHLY_BUDGET || existingValue('MONTHLY_BUDGET') || '150',
      AZURE_BUDGET_START_DATE: state.budgetStartDate,
      AZURE_INTEGRATION_SETTINGS: existingValue('AZURE_INTEGRATION_SETTINGS') || '[]'
    }
  });
  if (result.status !== 0) throw new Error('Infrastructure operation failed; saved state is retained for retry');
  if (process.argv.includes('--apply')) {
    const outputs = json('deployment', 'group', 'show', '--resource-group', state.resourceGroup, '--name', `joviq-${environment}`).properties.outputs;
    state.outputs = outputs;
    save(state);
    const user = json('ad', 'signed-in-user', 'show');
    json('role', 'assignment', 'create', '--assignee-object-id', user.id,
      '--assignee-principal-type', 'User', '--role', 'Key Vault Secrets Officer',
      '--scope', `${scope}/providers/Microsoft.KeyVault/vaults/${outputs.vaultName.value}`);
    for (const [name, value] of Object.entries({
      AZURE_API_NAME: outputs.apiName.value, AZURE_API_URL: outputs.apiUrl.value,
      AZURE_FRONTEND_NAME: outputs.frontendName.value, AZURE_FRONTEND_URL: outputs.frontendUrl.value,
      AZURE_VAULT_NAME: outputs.vaultName.value, AZURE_USE_RELEASE_SLOT: outputs.useReleaseSlot.value
    })) variable(name, value);
    for (const resourceName of [outputs.apiName.value, outputs.frontendName.value]) {
      const type = resourceName === outputs.apiName.value ? 'sites' : 'staticSites';
      json('role', 'assignment', 'create', '--assignee-object-id', state.identities.deploy.principalId,
        '--assignee-principal-type', 'ServicePrincipal', '--role', 'Contributor',
        '--scope', `${scope}/providers/Microsoft.Web/${type}/${resourceName}`);
    }
    const token = json('staticwebapp', 'secrets', 'list', '--resource-group', state.resourceGroup, '--name', outputs.frontendName.value).properties.apiKey;
    secret('AZURE_STATIC_WEB_APPS_API_TOKEN', token);
    console.log(`Configured ${environment}: ${outputs.frontendUrl.value} -> ${outputs.apiUrl.value}`);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
