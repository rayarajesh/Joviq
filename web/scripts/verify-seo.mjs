import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const config = JSON.parse(await readFile('dist/staticwebapp.config.json', 'utf8'));
// Azure normalizes trailing slashes when checking duplicate route rules.
const normalizedRoutes = config.routes.map(({ route }) => route.replace(/\/$/, '') || '/');
assert.equal(new Set(normalizedRoutes).size, normalizedRoutes.length, 'Duplicate Azure route rules');
const indexable = !config.globalHeaders['X-Robots-Tag'];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.route('**/*', route => route.abort());
  await page.setContent(await readFile('dist/index.html', 'utf8'));
  assert.match(await page.title(), /Joviq Technologies/);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://joviqtechnologies.com/');
  assert.ok((await page.locator('#root').innerText()).length > 500);
  const schema = JSON.parse(await page.locator('#seo-structured-data').textContent());
  assert.ok(schema['@graph'].some(item => item['@type'] === 'Organization'));
  const organization = schema['@graph'].find(item => item['@type'] === 'Organization');
  const website = schema['@graph'].find(item => item['@type'] === 'WebSite');
  assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim(), 'Joviq Technologies');
  assert.equal(website.name, 'Joviq Technologies');
  assert.equal(website.name, organization.name);
  assert.deepEqual(website.alternateName, organization.alternateName);
  assert.equal(website.url, 'https://joviqtechnologies.com/');
  assert.equal(organization.address.addressLocality, 'Hyderabad');
  assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute('content'), website.name);
  assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /Joviq Technologies.*Hyderabad/);
  assert.deepEqual(organization.sameAs, [
    'https://www.instagram.com/joviqtechnologies/',
    'https://www.linkedin.com/company/joviq-technologies-private-limited/',
    'https://www.facebook.com/joviqtechnologies'
  ]);
  assert.equal(organization.telephone, '+919281977188');
  assert.equal(organization.email, 'info@joviqtechnologies.com');
  for (const url of organization.sameAs) {
    assert.equal(new URL(url).search, '');
    assert.ok(await page.locator(`footer a[href="${url}"]`).count(), `Social profile not visible: ${url}`);
  }
  assert.ok(schema['@graph'].some(item => item['@type'] === 'WebSite'));
  assert.ok(schema['@graph'].find(item => item['@type'] === 'WebSite').alternateName.includes('Joviq'));
  for (const path of ['/programs', '/features', '/about', '/careers', '/campus-partners', '/request-callback', '/reviews', '/campus-delegate', '/cookie-policy']) {
    assert.ok(await page.locator(`footer a[href="${path}"]`).count(), `Missing crawlable footer link: ${path}`);
  }
  assert.equal(await page.locator('meta[property="og:image"]').count(), 1);
  await page.setContent(await readFile('dist/about/index.html', 'utf8'));
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://joviqtechnologies.com/about');
  assert.match(await page.title(), /About Joviq Technologies/);
  assert.ok((await page.locator('#root').innerText()).length > 500);
  assert.ok(await page.locator('main a[href="/careers"]').count());
  assert.ok(await page.locator('main a[href="/campus-delegate"]').count());
  for (const { rewrite } of config.routes.filter(route => route.rewrite?.endsWith('/index.html'))) {
    await page.setContent(await readFile(`dist${rewrite}`, 'utf8'));
    assert.equal(await page.locator('[data-reveal].sc-reveal, [data-reveal].dl-reveal').count(), 0,
      `Runtime animation state hides static content: ${rewrite}`);
  }
  await page.setContent(await readFile('dist/account.html', 'utf8'));
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
  assert.equal(config.routes.find(route => route.route === '/dashboard').headers['X-Robots-Tag'], 'noindex, nofollow');
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  const urls = await page.evaluate(xml => {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.querySelector('parsererror')) throw new Error('Invalid sitemap XML');
    return [...document.querySelectorAll('loc')].map(node => node.textContent);
  }, sitemap);
  if (indexable) {
    assert.ok(urls.length >= 14);
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.includes('https://joviqtechnologies.com/about'));
    for (const url of urls) {
      const path = new URL(url).pathname;
      const rewrite = path === '/' ? '/index.html' : `${path}/index.html`;
      assert.equal(config.routes.find(route => route.route === path)?.rewrite, rewrite);
    }
  } else assert.equal(urls.length, 0);
  assert.ok(urls.every(url => url.startsWith('https://joviqtechnologies.com/') && !url.includes('/dashboard') && !url.includes('/login')));
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.equal(robots.includes('Sitemap:'), indexable);
  assert.ok(config.navigationFallback.exclude.includes('/sitemap.xml'));
  console.log(`SEO verified: crawlable HTML, metadata, schema, sitemap, private-route noindex, and ${indexable ? 'production' : 'dev'} indexing rules.`);
} finally { await browser.close(); }
