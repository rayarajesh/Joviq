# Branded social previews

Both frontends use the existing branded 1200 x 630 JPEG at `/assets/og-joviq.jpg`.
Main-site course pages now use that logo artwork instead of unbranded course photos.
Public pages retain their own titles, descriptions and canonical Open Graph URLs.
The main site's account/unknown-route fallback has generic branded metadata and
retains its noindex rules; no student or account information is included.

## Build and deploy

Run `npm run build` in `web` and `web-single-page`. Deploy each complete `dist`
directory, including `staticwebapp.config.json`, route HTML and assets, to its
corresponding host. Build from the repository checkout: both builds use
`scripts/verify-social.mjs` in the repository root. Main-site production indexing
continues to use the existing `VITE_SEO_INDEXABLE=true` setting.

Do not deploy only the SPA index or replace the generated routing configuration:
social crawlers need the metadata in the initial HTML without JavaScript.

## After deployment

1. Open these public images without signing in; confirm HTTP 200 and `image/jpeg`:
   - https://joviqtechnologies.com/assets/og-joviq.jpg
   - https://joviqtechnologieslms.com/assets/og-joviq.jpg
2. View page source for both homepages, main-site `/about` and
   `/programs/full-stack-web-development`, and single-page `/onboarding` and
   `/launch`. Confirm one `og:title`, `og:description`, `og:url`, `og:image`, and
   matching Twitter title/description/image with `summary_large_image`.
3. Inspect each URL with https://www.linkedin.com/post-inspector/ and review the
   fetched title and branded image. Re-inspect after deployment if cached.
4. Paste the URLs into a WhatsApp test chat and wait for the preview before
   sending. Check homepage and internal links. If stale, try a fresh test URL
   such as `?preview=20261019` and allow caches to expire; canonical metadata
   remains the clean URL. Existing messages may retain their old previews.

The app controls the card layout and image placement. Local build checks verify
all public pages and actual JPEG dimensions, but cannot certify production host
accessibility or WhatsApp/LinkedIn rendering. These final checks require deployment.

## Future changes

Edit main-site page titles/descriptions and optional approved branded image
overrides in `web/src/seo.ts`. Edit single-page homepage metadata in
`web-single-page/index.html` and route text in its `scripts/prerender.mjs`.
If replacing the artwork, use a new filename on both sites and update metadata
references so image caches do not continue serving the previous file.
