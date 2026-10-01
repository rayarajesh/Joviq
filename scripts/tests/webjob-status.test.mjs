import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeJob, latestRun } from '../webjob-status.mjs';

test('reads both flattened and ARM nested WebJob models', () => {
  const run = { id: 'new-run', status: 'Success' };
  for (const input of [
    [{ name: 'initialize', latest_run: run }],
    { value: [{ name: 'api/initialize', properties: { latest_run: run } }] }
  ]) assert.deepEqual(latestRun(initializeJob(input)), run);
});
test('a missing job or a job without history cannot be mistaken for success', () => {
  assert.equal(initializeJob([]), undefined);
  assert.deepEqual(latestRun({ name: 'initialize' }), {});
});
test('derives a stable run ID from the Azure CLI camelCase history URL', () => {
  const run = latestRun({ latestRun: { url: 'https://example.scm.azurewebsites.net/api/triggeredwebjobs/initialize/history/202610010810323621', status: 'Success' } });
  assert.equal(run.id, '202610010810323621');
  assert.equal(run.status, 'Success');
});
