import { createServer as createHttpServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { chromium } from 'playwright';
import { createServer as createViteServer, loadEnv } from 'vite';

const dist = resolve('dist');
const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, entries: [] } });
const { publicPages, siteUrl } = await vite.ssrLoadModule('/src/seo.ts');
await vite.close();
const template = await readFile(resolve(dist, 'index.html'), 'utf8');
const indexable = (process.env.VITE_SEO_INDEXABLE ?? loadEnv('production', process.cwd(), 'VITE_').VITE_SEO_INDEXABLE) === 'true';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf' };
const server = createHttpServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(dist, `.${pathname}`);
    if (!path.startsWith(`${dist}/`) && path !== dist) { response.writeHead(403).end(); return; }
    if (!extname(pathname)) { response.setHeader('Content-Type', 'text/html'); response.end(template); return; }
    response.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
    response.end(await readFile(path));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  // Build only public content; never contact live APIs or capture account data.
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  for (const { path } of publicPages) {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(path => document.documentElement.dataset.seoPath === path && document.querySelector('#root h1'), path);
    const html = await page.evaluate(() => {
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      document.body.style.overflow = '';
      document.querySelectorAll('canvas').forEach(canvas => canvas.replaceChildren());
      return '<!doctype html>\n' + document.documentElement.outerHTML;
    });
    const output = path === '/' ? resolve(dist, 'index.html') : resolve(dist, `.${path}`, 'index.html');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html);
  }
  // Account routes must not initially inherit the homepage's indexable metadata.
  const noindexTemplate = template.replace('</head>', '<meta name="robots" content="noindex, follow" /></head>');
  await writeFile(resolve(dist, 'account.html'), noindexTemplate);
  const configPath = resolve(dist, 'staticwebapp.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.routes = [
    ...publicPages.flatMap(({ path }) => {
      const rewrite = path === '/' ? '/index.html' : `${path}/index.html`;
      return (path === '/' ? [path] : [path, `${path}/`]).map(route => ({ route, rewrite }));
    }),
    ...['/login', '/dashboard', '/dashboard/*', '/profile', '/checkout', '/learning/*', '/student/*', '/auth/*', '/verify/*', '/dev/*'].map(route => ({ route, headers: { 'X-Robots-Tag': 'noindex, nofollow' }, rewrite: '/account.html' })),
    { route: '/account.html', headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
  ];
  config.navigationFallback.rewrite = '/account.html';
  if (!indexable) config.globalHeaders['X-Robots-Tag'] = 'noindex, nofollow';
  config.navigationFallback.exclude.push('/robots.txt', '/sitemap.xml');
  await writeFile(configPath, JSON.stringify(config, null, 2));
  const robots = indexable ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n` : 'User-agent: *\nAllow: /\n';
  await writeFile(resolve(dist, 'robots.txt'), robots);
  const urls = indexable ? publicPages.map(page => `<url><loc>${siteUrl}${page.path === '/' ? '/' : page.path}</loc></url>`).join('\n') : '';
  await writeFile(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  console.log(`Prerendered ${publicPages.length} public pages; indexing ${indexable ? 'enabled' : 'disabled'}.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
