import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Run from either frontend directory after prerendering. Inspect the HTML a
// social crawler receives, without relying on JavaScript execution.
const config = JSON.parse(await readFile('dist/staticwebapp.config.json', 'utf8'));
const files = new Map([['/index.html', '/']]);
for (const { route, rewrite } of config.routes ?? []) {
  if (rewrite?.endsWith('/index.html')) files.set(rewrite, route);
}
const checkedImages = new Set();
for (const [file, route] of files) {
  const html = await readFile(`dist${file}`, 'utf8');
  const tags = [...html.matchAll(/<meta\s+[^>]*>/gi)].map(([tag]) =>
    Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])));
  const meta = key => {
    const matches = tags.filter(tag => (tag.property ?? tag.name) === key);
    assert.equal(matches.length, 1, `${file}: expected one ${key}`);
    assert.ok(matches[0].content, `${file}: empty ${key}`);
    return matches[0].content;
  };
  const url = new URL(meta('og:url'));
  assert.equal(url.protocol, 'https:');
  assert.equal(url.pathname, route);
  assert.ok(['joviqtechnologies.com', 'joviqtechnologieslms.com'].includes(url.hostname));
  assert.equal(meta('twitter:title'), meta('og:title'));
  assert.equal(meta('twitter:description'), meta('og:description'));
  assert.equal(meta('twitter:card'), 'summary_large_image');
  const image = new URL(meta('og:image'));
  assert.equal(image.protocol, 'https:');
  assert.equal(image.origin, url.origin);
  assert.equal(meta('og:image:secure_url'), image.href);
  assert.equal(meta('twitter:image'), image.href);
  assert.equal(meta('twitter:image:alt'), meta('og:image:alt'));
  assert.equal(meta('og:image:type'), 'image/jpeg');
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  if (!checkedImages.has(image.href)) {
    const bytes = await readFile(`dist${image.pathname}`);
    assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Preview must be a JPEG');
    let dimensions;
    for (let offset = 2; offset < bytes.length;) {
      assert.equal(bytes[offset], 0xff);
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        dimensions = [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
        break;
      }
      offset += length + 2;
    }
    assert.deepEqual(dimensions, [1200, 630], `${image.href}: actual image dimensions`);
    checkedImages.add(image.href);
  }
}
console.log(`Social previews verified in ${files.size} static pages; HTTPS images exist and are 1200 x 630 JPEGs.`);
