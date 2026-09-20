import { mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isAbsolute } from "node:path";

// Use an existing Playwright installation; this audit never installs packages.
const modulePath = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(isAbsolute(modulePath) ? pathToFileURL(modulePath).href : modulePath);
process.chdir(fileURLToPath(new URL("../../../", import.meta.url)));
await mkdir("tmp", { recursive: true });
export { chromium };
