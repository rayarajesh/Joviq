import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    let failedRequests = 0;
    let checkoutRequests = 0;
    let scriptRequests = 0;
    let verified = false;
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('joviq-pending-enrollment', JSON.stringify({
        slug: 'data-science', planCode: 'SELF', programTitle: 'Data Science', paymentMode: 1
      }));
    });
    await page.route('https://sdk.cashfree.com/js/v3/cashfree.js', async (route) => {
      scriptRequests += 1;
      await route.fulfill({ contentType: 'text/javascript', body: `
        window.Cashfree = () => ({ checkout: async (options) => {
          window.checkoutOptions = options;
          return {};
        }});
      ` });
    });
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const user = { id: 'student', fullName: 'Checkout Test', email: 'test@example.com', roles: ['Student'], onboardingStatus: 'Completed' };
      let data = {};
      if (path.endsWith('/auth/refresh')) data = { accessToken: 'test-token', user };
      else if (path.endsWith('/auth/me')) data = user;
      else if (path.endsWith('/public/programs/data-science')) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        data = { id: 'program', title: 'Data Science', plans: [{ id: 'plan', code: 'SELF', isActive: true, reserveAmount: 1000, offerPrice: 7999 }] };
      } else if (path.endsWith('/enrollments')) data = { id: 'enrollment' };
      else if (path.endsWith('/payments/checkout')) {
        checkoutRequests += 1;
        data = { provider: 'Cashfree', paymentEnvironment: 'production', paymentSessionId: 'test-session', gatewayOrderId: 'test-order', expiresAt: new Date(Date.now() + 600000).toISOString(), transaction: { id: 'transaction', discountAmount: 0 } };
      } else if (path.endsWith('/payments/verify')) {
        if (!verified) return route.fulfill({ status: 409, contentType: 'application/problem+json', body: JSON.stringify({ title: 'Payment pending', errorCode: 'payment_pending' }) });
        data = { status: 'Paid' };
      } else if (path.endsWith('/failed')) failedRequests += 1;
      else if (path.endsWith('/lms/dashboard')) data = { enrollment: { paidAmount: 1000 } };
      else data = [];
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data }) });
    });
    await page.goto(process.env.CHECKOUT_TEST_URL ?? 'http://localhost:5173/checkout?autostart=1');
    await page.getByRole('heading', { name: 'Checkout closed' }).waitFor({ timeout: 20000 });
    const rejectCookies = page.getByRole('button', { name: 'Reject All' });
    if (await rejectCookies.isVisible()) await rejectCookies.click();
    assert.equal(await page.evaluate(() => window.checkoutOptions.redirectTarget), '_modal');
    assert.equal(checkoutRequests, 1);
    assert.equal(scriptRequests, 1);
    assert.equal(failedRequests, 0);
    assert.equal(await page.getByText('We could not open checkout').count(), 0);
    assert.equal(await page.getByRole('navigation', { name: 'Connect with Joviq' }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `/tmp/joviq-checkout-closed-${width}.png`, fullPage: true });
    verified = true;
    await page.getByRole('button', { name: 'Check payment status' }).click();
    await page.waitForURL('**/dashboard?payment=success');
    assert.equal(checkoutRequests, 1, 'status checks must not create another order');
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Cashfree modal, closed/pending safety, verification and layout passed (${width}px)`);
  }
} finally {
  await browser.close();
}
