import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../verify-catalog.mjs';

const program = { id: 'program-id', slug: 'data-science', startingPrice: 7999 };
test('accepts a published catalog with server pricing', () => {
  assert.deepEqual(validateCatalog({ success: true, data: [program] }), [program]);
});
test('rejects a healthy API with an empty catalog', () => {
  assert.throws(() => validateCatalog({ success: true, data: [] }), /empty/);
  assert.throws(() => validateCatalog({ success: false, data: [program] }), /unavailable/);
});
test('rejects duplicate slugs and programs without checkout pricing', () => {
  assert.throws(() => validateCatalog({ success: true, data: [program, program] }), /duplicate/);
  assert.throws(() => validateCatalog({ success: true, data: [{ ...program, startingPrice: 0 }] }), /pricing/);
});
