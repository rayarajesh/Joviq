import test from 'node:test';
import assert from 'node:assert/strict';
import { parameters, integrations } from '../provision.mjs';

const env = {
  DEPLOY_ENVIRONMENT: 'dev', POSTGRES_ADMIN_PASSWORD: 'a'.repeat(48),
  POSTGRES_RUNTIME_PASSWORD: 'b'.repeat(48), JWT_SIGNING_KEY: 'c'.repeat(64)
};
test('provisioning keeps passwords in structured secure parameter values', () => {
  assert.equal(parameters(env).postgresAdminPassword.value, env.POSTGRES_ADMIN_PASSWORD);
  assert.equal(parameters(env).enableReleaseSlot.value, false);
});
test('integration configuration requires Key Vault references for credentials', () => {
  assert.throws(() => integrations(JSON.stringify([{ name: 'EmailSettings__Password', value: 'password-in-config' }])));
  assert.throws(() => integrations(JSON.stringify([{ name: 'ConnectionStrings__DefaultConnection', value: 'override' }])));
  assert.equal(integrations(JSON.stringify([{ name: 'EmailSettings__Password', value: '@Microsoft.KeyVault(SecretUri=https://joviq.vault.azure.net/secrets/smtp-password)' }])).length, 1);
});
test('rejects unexpected environment, weak credentials and invalid budget', () => {
  assert.throws(() => parameters({ ...env, DEPLOY_ENVIRONMENT: 'preview' }));
  assert.throws(() => parameters({ ...env, POSTGRES_ADMIN_PASSWORD: 'unsafe;password' }));
  assert.throws(() => parameters({ ...env, MONTHLY_BUDGET: '-1' }));
});
test('custom domains retain exact HTTPS origins and reject unsafe values', () => {
  const values = parameters({ ...env, FRONTEND_ORIGIN: 'https://joviqtechnologies.com', ADDITIONAL_FRONTEND_ORIGINS: '["https://www.joviqtechnologies.com"]' });
  assert.deepEqual(values.additionalFrontendOrigins.value, ['https://www.joviqtechnologies.com']);
  for (const value of ['http://example.com', 'https://example.com/path', '*', 'https://user:pass@example.com']) {
    assert.throws(() => parameters({ ...env, FRONTEND_ORIGIN: value }));
    assert.throws(() => parameters({ ...env, ADDITIONAL_FRONTEND_ORIGINS: JSON.stringify([value]) }));
  }
  assert.throws(() => parameters({ ...env, ADDITIONAL_FRONTEND_ORIGINS: '{}' }));
});
