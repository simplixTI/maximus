// Smoke test: navigates every public + protected route, captures screenshots,
// logs console errors. Run: node e2e/smoke.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:5174";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const routes = [
  { path: "/", name: "01-splash" },
  { path: "/login", name: "02-login" },
  { path: "/client/signup", name: "03-signup" },
  { path: "/client/dashboard", name: "04-client-dashboard-redirect" },
  { path: "/provider/onboarding", name: "05-provider-onboarding" },
  { path: "/admin", name: "06-admin-redirect" },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[${m.location().url}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

for (const r of routes) {
  const url = BASE + r.path;
  console.log(`→ ${r.name.padEnd(35)} ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${r.name}.png`), fullPage: true });
  } catch (e) {
    errors.push(`nav ${r.path} failed: ${e.message}`);
  }
}

await browser.close();

console.log("\n== Screenshots written to", OUT, "==");
if (errors.length) {
  console.log("\n== Console errors ==");
  for (const err of errors) console.log("  ✗", err);
  process.exit(1);
}
console.log("\n✓ No console errors.");
