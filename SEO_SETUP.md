# Joviq Technologies Search Setup

Canonical website: https://joviqtechnologies.com

## Implemented

- Route-specific titles, descriptions, canonical links, Open Graph and social previews.
- Organization and WebSite structured data using the existing company identity; breadcrumbs on public pages. No invented ratings, awards, partnerships or search-ranking promises.
- Build-time rendering of the existing public pages and program content, so search engines receive real page content without running JavaScript.
- Public-only sitemap at `/sitemap.xml` and crawl instructions at `/robots.txt`.
- Account, certificate verification and protected routes carry noindex HTTP headers; dev builds carry global noindex headers and an empty sitemap.
- Production builds explicitly set `VITE_SEO_INDEXABLE=true`; local/dev defaults are false. Canonicals point to the owned production domain, including when visitors use www or the Azure hostname.
- Automated checks cover static content, structured data, canonical URLs, sitemap XML, and indexing rules. CI verifies both dev and production indexing modes. Install the build browser with `npm --prefix web exec -- playwright install chromium` before local builds.

## Owner Follow-Up

Local follow-up changes add Learner Reviews, Campus Delegate Program and Cookie Policy footer links, plus existing Instagram, LinkedIn and Facebook profile URLs in Organization structured data. WhatsApp remains a contact link, not an identity profile. These changes do not create or modify Google Business Profile social links. No additional social accounts, reviews, opening hours or visit data are invented.

Google generates sitelinks and related searches automatically; there is no website setting to force a particular list or top rankings. Google also generates Popular times from sufficient aggregated visit data and does not allow manually adding the chart. Confirm the actual daily opening hours before adding them to the website or a business listing. Do not copy another business's hours or popular-time graph.

Reference: https://support.google.com/business/answer/6263531

1. Sign in to Google Search Console using the account that manages this business. Add or select the `joviqtechnologies.com` domain property. Keep the existing Google DNS verification TXT record; a different account may need its own verification token.
2. Submit `https://joviqtechnologies.com/sitemap.xml` and inspect the homepage URL. Request indexing after the production deployment is verified.
3. Monitor indexing, queries, clicks, Core Web Vitals and crawl errors. Google decides whether and when it indexes pages, uses structured data, and shows sitelinks or a business panel.
4. Publish original, accurate course and company information. Verify existing public testimonials, statistics, brand logos and partnership claims before launch. Metadata does not validate those claims.
5. Add verified official social profiles and a Google Business Profile only when the business meets Google's eligibility requirements. No profiles or listings are created by this code change.

Typing the brand name or a misspelling into Google cannot be guaranteed to display every page or company detail. Useful content, consistent branding, crawlable pages and verified ownership help Google understand the site over time; keyword stuffing and fabricated reviews are not used.
