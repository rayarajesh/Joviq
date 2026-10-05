import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tracked payment defaults contain no credentials and use sandbox mode', () => {
  const settings = JSON.parse(readFileSync(new URL('../../api/src/Joviq.Lms.Api/appsettings.json', import.meta.url), 'utf8'));
  assert.equal(settings.Payments.KeyId, '');
  assert.equal(settings.Payments.KeySecret, '');
  assert.equal(settings.Payments.WebhookSecret, '');
  assert.equal(settings.Payments.CashfreeEnvironment, 'sandbox');
});
