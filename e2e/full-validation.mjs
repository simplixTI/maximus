// Full validation: public routes + client flow + admin flow.
// Run: BASE_URL=https://www.maximussolutions.app \
//      CLIENT_EMAIL=... CLIENT_PW=... ADMIN_EMAIL=... ADMIN_PW=... \
//      node e2e/full-validation.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "https://www.maximussolutions.app";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots-validation");
fs.mkdirSync(OUT, { recursive: true });

const CLIENT = { email: process.env.CLIENT_EMAIL, password: process.env.CLIENT_PW };
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PW };

const report = { public: [], client: [], admin: [], provider: [], errors: [], warnings: [], network: [] };

function makeLogger(page, bucket) {
  page.on("console", (m) => {
    const t = m.type();
    const txt = m.text();
    if (t === "error") report.errors.push(`[${bucket}] ${txt}`);
    else if (t === "warning" && !/analytics|gtm|facebook|Download the React DevTools/i.test(txt))
      report.warnings.push(`[${bucket}] ${txt}`);
  });
  page.on("pageerror", (e) => report.errors.push(`[${bucket}] pageerror: ${e.message}`));
  page.on("response", async (r) => {
    const s = r.status();
    const u = r.url();
    if (s >= 400 && !u.includes("favicon") && !u.includes("hot-update")) {
      report.network.push(`[${bucket}] ${s} ${u}`);
    }
  });
}

async function screenshot(page, name) {
  try {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  } catch (e) {
    report.errors.push(`screenshot ${name} failed: ${e.message}`);
  }
}

async function goto(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  } catch {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch (e) {
      report.errors.push(`nav ${url} failed: ${e.message}`);
      return false;
    }
  }
  await page.waitForTimeout(800);
  return true;
}

async function loginAs(page, creds, tag) {
  if (!creds.email || !creds.password) {
    report.errors.push(`[${tag}] missing credentials in env`);
    return false;
  }
  await goto(page, `${BASE}/login`);
  await screenshot(page, `${tag}-01-login`);
  const emailSel = 'input[type="email"], input[name="email"], input[id*="email" i]';
  const passSel = 'input[type="password"], input[name="password"]';
  try {
    await page.fill(emailSel, creds.email);
    await page.fill(passSel, creds.password);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login"), button:has-text("Entrar")');
    await page.waitForTimeout(3500);
    await screenshot(page, `${tag}-02-after-login`);
    const url = page.url();
    if (url.includes("/login")) {
      report.errors.push(`[${tag}] Still on /login after credentials — login failed`);
      return false;
    }
    return true;
  } catch (e) {
    report.errors.push(`[${tag}] login failed: ${e.message}`);
    return false;
  }
}

const browser = await chromium.launch();

// ============ PHASE 1: Public routes on mobile viewport ============
console.log("\n=== PHASE 1: Public routes (mobile) ===");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  makeLogger(page, "public");
  const routes = [
    { path: "/", name: "pub-01-home" },
    { path: "/login", name: "pub-02-login" },
    { path: "/client/signup", name: "pub-03-client-signup" },
    { path: "/provider/onboarding", name: "pub-04-provider-onboarding" },
    { path: "/install", name: "pub-05-install" },
  ];
  for (const r of routes) {
    console.log(`  → ${r.name.padEnd(35)} ${BASE}${r.path}`);
    if (await goto(page, `${BASE}${r.path}`)) {
      await screenshot(page, r.name);
      report.public.push(`${r.path}: OK`);
    }
  }
  await ctx.close();
}

// ============ PHASE 2: Public routes on desktop viewport ============
console.log("\n=== PHASE 2: Public routes (desktop) ===");
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  makeLogger(page, "public-desktop");
  const routes = [
    { path: "/", name: "desk-01-home" },
    { path: "/login", name: "desk-02-login" },
    { path: "/client/signup", name: "desk-03-client-signup" },
  ];
  for (const r of routes) {
    console.log(`  → ${r.name.padEnd(35)} ${BASE}${r.path}`);
    if (await goto(page, `${BASE}${r.path}`)) {
      await screenshot(page, r.name);
    }
  }
  await ctx.close();
}

// ============ PHASE 3: Client flow ============
console.log("\n=== PHASE 3: Client flow ===");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  makeLogger(page, "client");
  const ok = await loginAs(page, CLIENT, "client");
  if (ok) {
    report.client.push(`login OK — landed at ${page.url()}`);
    const routes = [
      { path: "/client/dashboard", name: "client-03-dashboard" },
      { path: "/client/bookings", name: "client-04-bookings" },
      { path: "/client/request", name: "client-05-request" },
      { path: "/client/profile", name: "client-06-profile" },
    ];
    for (const r of routes) {
      console.log(`  → ${r.name.padEnd(35)} ${BASE}${r.path}`);
      if (await goto(page, `${BASE}${r.path}`)) {
        await screenshot(page, r.name);
        report.client.push(`${r.path}: OK`);
      }
    }
  } else {
    report.client.push("login FAILED — skipping protected routes");
  }
  await ctx.close();
}

// ============ PHASE 4: Admin flow ============
console.log("\n=== PHASE 4: Admin flow ===");
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  makeLogger(page, "admin");
  const ok = await loginAs(page, ADMIN, "admin");
  if (ok) {
    report.admin.push(`login OK — landed at ${page.url()}`);
    const routes = [
      { path: "/admin", name: "admin-03-home" },
      { path: "/admin/dashboard", name: "admin-04-dashboard" },
      { path: "/admin/quotes", name: "admin-05-quotes" },
      { path: "/admin/approvals", name: "admin-06-approvals" },
      { path: "/admin/users", name: "admin-07-users" },
      { path: "/admin/bookings", name: "admin-08-bookings" },
    ];
    for (const r of routes) {
      console.log(`  → ${r.name.padEnd(35)} ${BASE}${r.path}`);
      if (await goto(page, `${BASE}${r.path}`)) {
        await screenshot(page, r.name);
        report.admin.push(`${r.path}: OK`);
      }
    }
  } else {
    report.admin.push("login FAILED — skipping protected routes");
  }
  await ctx.close();
}

await browser.close();

const summary = {
  base: BASE,
  timestamp: new Date().toISOString(),
  screenshotsDir: OUT,
  publicRoutes: report.public,
  clientRoutes: report.client,
  adminRoutes: report.admin,
  errorCount: report.errors.length,
  warningCount: report.warnings.length,
  networkFailureCount: report.network.length,
  errors: report.errors,
  warnings: report.warnings.slice(0, 30),
  networkFailures: report.network.slice(0, 30),
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));

console.log("\n" + "=".repeat(60));
console.log("VALIDATION REPORT");
console.log("=".repeat(60));
console.log("Base:", BASE);
console.log("Screenshots:", OUT);
console.log("\nPublic routes:", report.public.length);
console.log("Client routes:", report.client.length);
console.log("Admin routes:", report.admin.length);
console.log("\nConsole errors:", report.errors.length);
console.log("Console warnings:", report.warnings.length);
console.log("Network 4xx/5xx:", report.network.length);

if (report.errors.length) {
  console.log("\n== Errors ==");
  for (const e of report.errors.slice(0, 30)) console.log("  ✗", e);
}
if (report.network.length) {
  console.log("\n== Network failures ==");
  for (const n of report.network.slice(0, 30)) console.log("  ✗", n);
}
if (report.warnings.length) {
  console.log("\n== Warnings (top 15) ==");
  for (const w of report.warnings.slice(0, 15)) console.log("  ⚠", w);
}
process.exit(report.errors.length ? 1 : 0);
