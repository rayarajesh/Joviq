// Generates per-URL HTML so social scrapers (WhatsApp, LinkedIn, X, …) get route-specific
// Open Graph / Twitter metadata. The SPA serves one index.html, so without this every URL would
// share the homepage preview. Runs after `vite build`; no browser needed — it only swaps the
// title/description/url metadata that differ per route (the branded og:image stays the same).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const dist = resolve("dist");
const siteUrl = "https://joviqtechnologieslms.com";

const launch = {
  title: "Launch plan | Joviq Technologies",
  description: "Start with the Joviq Launch plan — live sessions, recorded lessons and hands-on, project-first learning. Reserve your seat or pay in full."
};
const elevate = {
  title: "Elevate plan | Joviq Technologies",
  description: "Go further with the Joviq Elevate plan — more live sessions, recorded lessons and hands-on, project-first learning. Reserve your seat or pay in full."
};

// The homepage (/) keeps the metadata already in index.html. These routes each get their own.
const routes = [
  { path: "/onboarding", title: "Resume your onboarding | Joviq Technologies", description: "Already paid? Enter the email used during payment to finish your Joviq onboarding — choose your course and start date. No new payment required." },
  { path: "/launch", ...launch },
  { path: "/launch/reserve", ...launch },
  { path: "/launch/full", ...launch },
  { path: "/elevate", ...elevate },
  { path: "/elevate/reserve", ...elevate },
  { path: "/elevate/full", ...elevate }
];

const esc = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function applyMeta(html, { path, title, description }) {
  const url = `${siteUrl}${path}`;
  const t = esc(title);
  const d = esc(description);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
}

const base = await readFile(resolve(dist, "index.html"), "utf8");

for (const route of routes) {
  const output = resolve(dist, `.${route.path}`, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, applyMeta(base, route));
}

const configPath = resolve(dist, "staticwebapp.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
// Serve each prerendered route's own HTML; everything else keeps the SPA fallback to index.html.
config.routes = routes.map((route) => ({ route: route.path, rewrite: `${route.path}/index.html` }));
await writeFile(configPath, JSON.stringify(config, null, 2));

console.log(`Prerendered ${routes.length} single-page routes with per-URL social metadata.`);
