// Visual verification: logs in as admin and captures /admin at 3 viewports.
// Run: ADMIN_EMAIL=... ADMIN_PW=... node e2e/admin-visual.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "https://www.maximussolutions.app";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots-admin");
fs.mkdirSync(OUT, { recursive: true });

const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PW };
if (!ADMIN.email || !ADMIN.password) {
  console.error("Missing ADMIN_EMAIL / ADMIN_PW env");
  process.exit(1);
}

const viewports = [
  { name: "mobile-390", w: 390, h: 844 },
  { name: "tablet-768", w: 768, h: 1024 },
  { name: "desktop-1440", w: 1440, h: 900 },
];

const errors = [];
const browser = await chromium.launch();

for (const v of viewports) {
  console.log(`\n→ ${v.name}`);
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${v.name}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${v.name}] pageerror: ${e.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill('input[type="email"]', ADMIN.email);
  await page.fill('input[type="password"]', ADMIN.password);
  await page.click('button:has-text("Sign In")');
  try {
    await page.waitForURL(/\/admin/, { timeout: 20000 });
  } catch {
    console.log(`  login redirect timeout; current url=${page.url()}`);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, `${v.name}.png`), fullPage: true });
  console.log(`  saved ${v.name}.png`);
  await ctx.close();
}

await browser.close();
if (errors.length) {
  console.log("\n== Console errors ==");
  for (const e of errors) console.log("  ✗", e);
}
console.log("\nDone. Screenshots at:", OUT);
