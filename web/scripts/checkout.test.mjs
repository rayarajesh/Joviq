import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutEmailsMatch, resolveCheckoutEmail } from '../src/features/lms/checkout.ts';

test('signed-in checkout uses the current account instead of a stale or autofilled email', () => {
  assert.equal(resolveCheckoutEmail('other@example.com', ' Learner@Example.com '), 'learner@example.com');
});
test('a session restored after opening the form supplies the account email', () => {
  assert.equal(resolveCheckoutEmail('', 'learner@example.com'), 'learner@example.com');
});
test('signed-out checkout uses the entered email', () => {
  assert.equal(resolveCheckoutEmail(' New@Example.com '), 'new@example.com');
});

test('reuses the same signed-in email regardless of case or whitespace', () => {
  assert.equal(checkoutEmailsMatch(' Learner@Example.com ', 'learner@example.com'), true);
});
test('does not enroll a different email into the current account', () => {
  assert.equal(checkoutEmailsMatch('other@example.com', 'learner@example.com'), false);
});
test('empty emails never identify an existing account', () => {
  assert.equal(checkoutEmailsMatch(' ', ''), false);
});
