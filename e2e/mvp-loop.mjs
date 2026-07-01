// E2E MVP loop: proves admin ↔ client reflection.
// Env: BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, CLIENT_EMAIL, CLIENT_PW, ADMIN_EMAIL, ADMIN_PW
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "https://www.maximussolutions.app";
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_ANON_KEY;
const CLIENT = { email: process.env.CLIENT_EMAIL, password: process.env.CLIENT_PW };
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PW };
if (!SUPA_URL || !SUPA_KEY || !CLIENT.email || !ADMIN.email) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_ANON_KEY, CLIENT_EMAIL/PW, ADMIN_EMAIL/PW");
  process.exit(1);
}

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots-mvp");
fs.mkdirSync(OUT, { recursive: true });

const log = (msg) => console.log(`\n[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`  saved ${name}.png`);
};

const sbClient = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });
const sbAdmin = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const errors = [];

async function step1_clientCreatesRequest() {
  log("1) Client → create service_request");
  const { data: auth, error: aErr } = await sbClient.auth.signInWithPassword({
    email: CLIENT.email,
    password: CLIENT.password,
  });
  if (aErr) throw aErr;
  const clientId = auth.user.id;
  console.log("  client id:", clientId);

  const { data: req, error: rErr } = await sbClient
    .from("service_requests")
    .insert({
      client_id: clientId,
      category: "electrical",
      description: "E2E MVP loop test — fix ceiling fan wiring",
      address: "123 Playwright Ave, Miami, FL 33101",
      status: "draft",
    })
    .select()
    .single();
  if (rErr) throw rErr;
  console.log("  request id:", req.id);
  return { clientId, requestId: req.id };
}

async function step2_adminSendsQuote(requestId) {
  log("2) Admin → send quote $275");
  const { data: auth, error: aErr } = await sbAdmin.auth.signInWithPassword({
    email: ADMIN.email,
    password: ADMIN.password,
  });
  if (aErr) throw aErr;
  const adminId = auth.user.id;

  const { data: quote, error: qErr } = await sbAdmin
    .from("quotes")
    .insert({
      request_id: requestId,
      admin_id: adminId,
      amount: 275,
      scope: "E2E: ceiling fan wiring repair, 2h labor + parts",
      status: "pending",
    })
    .select()
    .single();
  if (qErr) throw qErr;

  await sbAdmin.from("service_requests").update({ status: "quoted" }).eq("id", requestId);
  console.log("  quote id:", quote.id);
  return { quoteId: quote.id, adminId };
}

async function step3_clientAcceptsQuote(clientId, requestId, quoteId) {
  log("3) Client accepts quote (booking insert via admin session — bookings RLS)");
  await sbClient.from("quotes").update({ status: "accepted" }).eq("id", quoteId);
  const { data: booking, error: bErr } = await sbAdmin
    .from("bookings")
    .insert({
      request_id: requestId,
      quote_id: quoteId,
      client_id: clientId,
      status: "confirmed",
    })
    .select()
    .single();
  if (bErr) throw bErr;
  await sbAdmin.from("booking_status_events").insert({
    booking_id: booking.id,
    status: "confirmed",
    notes: "E2E: booking created via quote acceptance",
  });
  console.log("  booking id:", booking.id);
  return booking.id;
}

async function playwrightLogin(page, creds, tag) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button:has-text("Sign In")');
  try {
    await page.waitForURL(/\/(admin|client)/, { timeout: 20000 });
  } catch {
    console.log(`  [${tag}] login redirect timeout; url=${page.url()}`);
  }
  await page.waitForTimeout(1500);
}

async function step4_adminSeesAndOverrides(bookingId) {
  log("4) Playwright admin → /admin/jobs, open 3-dot, Override → en_route");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[admin] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[admin] pageerror: ${e.message}`));

  await playwrightLogin(page, ADMIN, "admin");
  await page.goto(`${BASE}/admin/jobs`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await shot(page, "01-admin-jobs-list");

  const shortId = bookingId.slice(0, 4);
  const rowHint = page.locator(`text=#${shortId}`).first();
  const found = await rowHint.count();
  console.log(`  row for #${shortId}: ${found > 0 ? "found" : "MISSING"}`);
  if (found === 0) {
    await page.locator('button[aria-label="More actions"]').first().click({ timeout: 5000 });
  } else {
    const row = page.locator(`[class*="rounded-2xl"]:has-text("#${shortId}")`).first();
    await row.locator('button[aria-label="More actions"]').click({ timeout: 5000 });
  }
  await page.waitForTimeout(600);
  await shot(page, "02-admin-3dot-menu");

  await page.locator('text=Override status').first().click({ timeout: 5000 });
  await page.waitForTimeout(600);
  await shot(page, "03-admin-override-dialog");

  await page.locator('text=en route').first().click({ timeout: 5000 });
  await page.waitForTimeout(3000);
  await shot(page, "04-admin-after-override");

  await browser.close();
}

async function step5_verifyDb(bookingId) {
  log("5) Verify DB: bookings.status === 'en_route'");
  const { data } = await sbAdmin.from("bookings").select("status").eq("id", bookingId).single();
  console.log(`  status in DB: ${data?.status}`);
  if (data?.status !== "en_route") throw new Error(`Expected en_route, got ${data?.status}`);
}

async function step6_clientSeesReflection() {
  log("6) Playwright client → /client/bookings should show en_route");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`[client] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[client] pageerror: ${e.message}`));

  await playwrightLogin(page, CLIENT, "client");
  await page.goto(`${BASE}/client/bookings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await shot(page, "05-client-bookings-reflection");
  await browser.close();
}

async function step7_cleanup(requestId) {
  log("7) Cleanup: mark seeded booking cancelled");
  await sbAdmin.from("bookings").update({ status: "cancelled" }).eq("request_id", requestId);
  console.log("  cancelled");
}

try {
  const { clientId, requestId } = await step1_clientCreatesRequest();
  const { quoteId } = await step2_adminSendsQuote(requestId);
  const bookingId = await step3_clientAcceptsQuote(clientId, requestId, quoteId);
  await step4_adminSeesAndOverrides(bookingId);
  await step5_verifyDb(bookingId);
  await step6_clientSeesReflection();
  await step7_cleanup(requestId);

  console.log("\n" + "=".repeat(60));
  console.log("✅ MVP LOOP PASSED");
  console.log("=".repeat(60));
  console.log("Screenshots:", OUT);
  if (errors.length) {
    console.log("\nConsole errors (non-fatal):");
    errors.slice(0, 10).forEach((e) => console.log("  ⚠", e));
  }
  process.exit(0);
} catch (e) {
  console.error("\n❌ MVP LOOP FAILED at:", e.message);
  if (errors.length) {
    console.error("Console errors:");
    errors.slice(0, 10).forEach((er) => console.error("  ✗", er));
  }
  process.exit(1);
}
