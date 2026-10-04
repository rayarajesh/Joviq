import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutEmailsMatch } from '../src/features/lms/checkout.ts';

test('reuses the same signed-in email regardless of case or whitespace', () => {
  assert.equal(checkoutEmailsMatch(' Learner@Example.com ', 'learner@example.com'), true);
});
test('does not enroll a different email into the current account', () => {
  assert.equal(checkoutEmailsMatch('other@example.com', 'learner@example.com'), false);
});
test('empty emails never identify an existing account', () => {
  assert.equal(checkoutEmailsMatch(' ', ''), false);
});
