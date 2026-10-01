import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { integrations } from './provision.mjs';

const environment = process.argv[2];
if (!['dev', 'production'].includes(environment) || !process.argv[3])
  throw new Error('Usage: node scripts/configure-integrations.mjs dev|production .deploy-state/integrations.json');
const state = JSON.parse(readFileSync(`.deploy-state/${environment}.json`, 'utf8'));
if (!state.outputs) throw new Error('Provision the environment before configuring integrations');
const input = JSON.parse(readFileSync(process.argv[3], 'utf8'));
const vault = state.outputs.vaultName.value;
const settings = integrations(JSON.stringify(input.settings || []));
const directory = mkdtempSync(join(tmpdir(), 'joviq-integrations-'));
function run(tool, args, stdin) {
  const result = spawnSync(tool, args, { input: stdin, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${tool} operation failed: ${result.stderr}`);
  return result.stdout;
}
try {
  for (const [name, value] of Object.entries(input.secrets || {})) {
    if (!['smtp-password', 'google-client-secret', 'payment-key-secret', 'payment-webhook-secret'].includes(name) || typeof value !== 'string' || !value)
      throw new Error('Unsupported or empty integration secret');
    const path = join(directory, name);
    writeFileSync(path, value, { mode: 0o600 });
    run('az', ['keyvault', 'secret', 'set', '--vault-name', vault, '--name', name, '--file', path, '--encoding', 'utf-8', '--output', 'none']);
  }
  const path = join(directory, 'app-settings.json');
  writeFileSync(path, JSON.stringify(Object.fromEntries(settings.map(setting => [setting.name, setting.value]))), { mode: 0o600 });
  run('az', ['webapp', 'config', 'appsettings', 'set', '--resource-group', state.resourceGroup,
    '--name', state.outputs.apiName.value, '--settings', `@${path}`, '--output', 'none']);
  if (state.outputs.useReleaseSlot.value)
    run('az', ['webapp', 'config', 'appsettings', 'set', '--resource-group', state.resourceGroup,
      '--name', state.outputs.apiName.value, '--slot', 'release', '--settings', `@${path}`, '--output', 'none']);
  run('gh', ['variable', 'set', 'AZURE_INTEGRATION_SETTINGS', '--repo', 'rayarajesh/Joviq', '--env', environment, '--body', JSON.stringify(settings)]);
  console.log(`Configured integrations for ${environment}; credentials remain in Key Vault.`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
