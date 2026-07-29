// Capture 8 public screenshots of the deployed site at phone viewport.
// Run: node scripts/screenshots.mjs
// Output: screenshots/01-*.png ... 08-*.png (full page, PNG)

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "screenshots");

const BASE = "https://www.maximussolutions.app";

const PAGES = [
  { file: "01-landing.png",          url: `${BASE}/`,                  wait: 1500 },
  { file: "02-login.png",            url: `${BASE}/login`,             wait: 1000 },
  { file: "03-client-signup.png",    url: `${BASE}/client/signup`,     wait: 1000 },
  { file: "04-forgot-password.png",  url: `${BASE}/forgot-password`,   wait: 1000 },
  { file: "05-install.png",          url: `${BASE}/install`,           wait: 1000 },
  { file: "06-privacy.png",          url: `${BASE}/privacy`,           wait: 1000 },
  { file: "07-terms.png",            url: `${BASE}/terms`,             wait: 1000 },
  { file: "08-account-deletion.png", url: `${BASE}/account-deletion`,  wait: 1000 },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 6) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  });

  const page = await context.newPage();

  for (const { file, url, wait } of PAGES) {
    const out = path.join(OUT_DIR, file);
    process.stdout.write(`-> ${url} ... `);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(wait);
      await page.screenshot({ path: out, fullPage: true, type: "png" });
      console.log(`OK  ${file}`);
    } catch (e) {
      console.log(`FAIL  ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\nDone. ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
