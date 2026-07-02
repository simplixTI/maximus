// End-to-end QA: exercises the full request → quote → booking → status loop
// like a real user, uploads a real photo, captures every console error,
// network failure, missing element, and unexpected state.
//
// Run:
//   BASE_URL=... SUPABASE_URL=... SUPABASE_ANON_KEY=... \
//   CLIENT_EMAIL=... CLIENT_PW=... ADMIN_EMAIL=... ADMIN_PW=... \
//   node e2e/qa-full-flow.mjs

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
for (const [k, v] of Object.entries({ SUPA_URL, SUPA_KEY, ...CLIENT, ...ADMIN })) {
  if (!v) {
    console.error("Missing env:", k);
    process.exit(1);
  }
}

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots-qa");
fs.mkdirSync(OUT, { recursive: true });
const TEST_PHOTO = path.join(OUT, "_test-photo.jpg");

const ORANGE_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";
fs.writeFileSync(TEST_PHOTO, Buffer.from(ORANGE_JPEG_B64, "base64"));

const findings = [];
const record = (severity, area, msg) => {
  const entry = { severity, area, msg, at: new Date().toISOString() };
  findings.push(entry);
  const icon = severity === "FAIL" ? "✗" : severity === "WARN" ? "⚠" : "ℹ";
  console.log(`  ${icon} [${area}] ${msg}`);
};

const attachLoggers = (page, tag) => {
  page.on("console", (m) => {
    const type = m.type();
    const txt = m.text();
    if (type === "error") record("FAIL", `${tag}/console`, txt.slice(0, 220));
    else if (type === "warning" && !/analytics|gtm|Download the React DevTools/i.test(txt))
      record("WARN", `${tag}/console`, txt.slice(0, 200));
  });
  page.on("pageerror", (e) => record("FAIL", `${tag}/pageerror`, e.message));
  page.on("response", (r) => {
    const s = r.status();
    const u = r.url();
    if (s >= 400 && !u.includes("favicon") && !u.includes("hot-update"))
      record("FAIL", `${tag}/network`, `${s} ${u.slice(0, 150)}`);
  });
};

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`    📸 ${name}.png`);
};

const supaClient = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });
const supaAdmin = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

async function login(page, creds, tag) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button:has-text("Sign In")');
  try {
    await page.waitForURL(/\/(admin|client)/, { timeout: 20000 });
  } catch {
    record("FAIL", `${tag}/login`, `stuck at ${page.url()}`);
  }
  await page.waitForTimeout(1500);
}

async function seedRequestWithPhoto() {
  console.log("\n▶ Seeding a request with photo directly via Supabase…");
  const { data: auth, error: aErr } = await supaClient.auth.signInWithPassword({
    email: CLIENT.email,
    password: CLIENT.password,
  });
  if (aErr) {
    record("FAIL", "seed/auth", aErr.message);
    return null;
  }
  const clientId = auth.user.id;

  const file = fs.readFileSync(TEST_PHOTO);
  const photoPath = `requests/${clientId}/${Date.now()}-qa-test.jpg`;
  const { error: upErr } = await supaClient.storage
    .from("job-photos")
    .upload(photoPath, file, { contentType: "image/jpeg", upsert: false });
  if (upErr) {
    record("FAIL", "seed/storage", `photo upload failed: ${upErr.message}`);
  } else {
    console.log(`  ✓ photo uploaded to ${photoPath}`);
  }

  const { data: req, error: rErr } = await supaClient
    .from("service_requests")
    .insert({
      client_id: clientId,
      category: "Electrical",
      description: "QA: Ceiling fan wiring — photo attached",
      address: "555 QA Blvd, Miami FL 33101",
      photos: upErr ? [] : [photoPath],
      status: "draft",
    })
    .select()
    .single();
  if (rErr) {
    record("FAIL", "seed/insert", rErr.message);
    return null;
  }
  console.log(`  ✓ request seeded (id=${req.id.slice(0, 8)})`);
  return { clientId, requestId: req.id, photoPath };
}

async function cleanup(requestId) {
  if (!requestId) return;
  await supaAdmin.auth.signInWithPassword({ email: ADMIN.email, password: ADMIN.password });
  await supaAdmin.from("bookings").update({ status: "cancelled" }).eq("request_id", requestId);
  await supaAdmin.from("service_requests").update({ status: "cancelled" }).eq("id", requestId);
  console.log("  ✓ cleaned up");
}

async function testClientHome() {
  console.log("\n▶ Test A: Client home shows Your Requests");
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attachLoggers(page, "client-home");
  await login(page, CLIENT, "client-home");
  await page.goto(`${BASE}/client/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await shot(page, "A1-client-home");

  const yourRequests = await page.locator('text="Your Requests"').count();
  if (yourRequests === 0) record("FAIL", "client-home", '"Your Requests" section missing');
  else console.log("  ✓ Your Requests section rendered");

  const awaiting = await page.locator('text="Awaiting quote"').count();
  if (awaiting === 0) record("FAIL", "client-home", "No item shows Awaiting quote status");
  else console.log(`  ✓ ${awaiting} awaiting-quote badge visible`);
  await b.close();
}

async function testAdminSeesRequestWithPhotos() {
  console.log("\n▶ Test B: Admin sees pending request WITH photos gallery");
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attachLoggers(page, "admin-quotes");
  await login(page, ADMIN, "admin-quotes");
  await page.goto(`${BASE}/admin/quotes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await shot(page, "B1-admin-quotes-list");

  const pending = await page.locator("text=/Pending Requests/i").count();
  if (pending === 0) record("FAIL", "admin-quotes", '"Pending Requests" header missing');

  const clientPhotos = await page.locator("text=/Client photos/i").count();
  if (clientPhotos === 0) record("FAIL", "admin-photos", '"Client photos" label not rendered');
  else console.log("  ✓ Client photos label rendered");

  const img = page.locator('button[aria-label^="Open photo"]').first();
  const imgCount = await img.count();
  if (imgCount === 0) record("FAIL", "admin-photos", "No clickable photo thumbnail");
  else {
    console.log(`  ✓ ${imgCount} thumbnail(s) visible`);
    await img.click();
    await page.waitForTimeout(700);
    await shot(page, "B2-admin-photo-lightbox");
    const closeBtn = await page.locator('[role="dialog"] button[aria-label="Close"]').count();
    if (closeBtn === 0) record("FAIL", "admin-photos", "Lightbox opened but Close missing");
    else console.log("  ✓ Lightbox opened correctly");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }
  await b.close();
}

async function testAdminSendsQuote(requestId) {
  console.log("\n▶ Test C: Admin sends quote via Supabase");
  const { data: adminAuth } = await supaAdmin.auth.signInWithPassword({
    email: ADMIN.email,
    password: ADMIN.password,
  });
  const { data: q, error } = await supaAdmin
    .from("quotes")
    .insert({
      request_id: requestId,
      admin_id: adminAuth.user.id,
      amount: 320,
      scope: "QA: fan rewiring + fixture, 2h labor",
      status: "pending",
    })
    .select()
    .single();
  if (error) {
    record("FAIL", "admin-send-quote", error.message);
    return null;
  }
  await supaAdmin.from("service_requests").update({ status: "quoted" }).eq("id", requestId);
  console.log(`  ✓ quote created ($320)`);
  return q.id;
}

async function testClientReceivesQuote() {
  console.log("\n▶ Test D: Client home reflects the new quote");
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attachLoggers(page, "client-quote-notice");
  await login(page, CLIENT, "client-quote-notice");
  await page.goto(`${BASE}/client/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await shot(page, "D1-client-home-after-quote");

  const cta = await page.locator("text=/quote(s)? waiting/i").count();
  const badge = await page.locator('text="Quote ready"').count();
  if (cta === 0 && badge === 0)
    record("FAIL", "client-realtime", 'Neither "Quotes waiting" nor "Quote ready" visible');
  else console.log(`  ✓ Client sees quote (cta=${cta}, badge=${badge})`);
  await b.close();
}

async function testAcceptAndBooking(clientId, requestId, quoteId) {
  console.log("\n▶ Test E: Accept + admin Jobs Ops shows booking");
  await supaClient.auth.signInWithPassword({ email: CLIENT.email, password: CLIENT.password });
  await supaClient.from("quotes").update({ status: "accepted" }).eq("id", quoteId);
  const { data: booking, error } = await supaAdmin
    .from("bookings")
    .insert({ request_id: requestId, quote_id: quoteId, client_id: clientId, status: "confirmed" })
    .select()
    .single();
  if (error) {
    record("FAIL", "accept-quote", error.message);
    return null;
  }
  await supaAdmin.from("booking_status_events").insert({
    booking_id: booking.id,
    status: "confirmed",
    notes: "QA seed",
  });
  console.log(`  ✓ booking created (id=${booking.id.slice(0, 8)})`);

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attachLoggers(page, "admin-jobs");
  await login(page, ADMIN, "admin-jobs");
  await page.goto(`${BASE}/admin/jobs`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await shot(page, "E1-admin-jobs-list");

  const shortId = booking.id.slice(0, 4);
  const row = await page.locator(`text=#${shortId}`).count();
  if (row === 0) record("FAIL", "admin-jobs", `booking #${shortId} not visible`);
  else console.log("  ✓ booking row visible");
  await b.close();
  return booking.id;
}

async function testAdminOverrideAndClientReflects(bookingId) {
  console.log("\n▶ Test F: Admin override → en_route; client sees it");
  await supaAdmin.from("bookings").update({ status: "en_route" }).eq("id", bookingId);
  await supaAdmin.from("booking_status_events").insert({
    booking_id: bookingId,
    status: "en_route",
    notes: "QA override",
  });
  const { data: check } = await supaAdmin
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();
  if (check?.status !== "en_route") record("FAIL", "override", `got ${check?.status}`);
  else console.log("  ✓ DB status = en_route");

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attachLoggers(page, "client-reflect");
  await login(page, CLIENT, "client-reflect");
  await page.goto(`${BASE}/client/bookings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await shot(page, "F1-client-sees-en-route");
  const enRoute = await page.locator("text=/en route/i").count();
  if (enRoute === 0) record("FAIL", "client-realtime", 'Client /bookings missing "En Route"');
  else console.log("  ✓ Client sees En Route badge");
  await b.close();
}

console.log("=".repeat(64));
console.log("QA FULL FLOW — Maximus MVP");
console.log("Target:", BASE);
console.log("=".repeat(64));

const seed = await seedRequestWithPhoto();
if (seed) {
  try {
    await testClientHome();
    await testAdminSeesRequestWithPhotos();
    const quoteId = await testAdminSendsQuote(seed.requestId);
    if (quoteId) {
      await testClientReceivesQuote();
      const bookingId = await testAcceptAndBooking(seed.clientId, seed.requestId, quoteId);
      if (bookingId) await testAdminOverrideAndClientReflects(bookingId);
    }
  } catch (e) {
    record("FAIL", "runner", e.message);
  } finally {
    await cleanup(seed.requestId);
  }
}

const summary = { total: findings.length, fail: 0, warn: 0, info: 0 };
for (const f of findings) summary[f.severity.toLowerCase()] = (summary[f.severity.toLowerCase()] ?? 0) + 1;
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ summary, findings }, null, 2));

console.log("\n" + "=".repeat(64));
console.log("QA REPORT");
console.log("=".repeat(64));
console.log(`Total findings: ${summary.total} (FAIL=${summary.fail}, WARN=${summary.warn}, INFO=${summary.info})`);
console.log(`Screenshots + report.json: ${OUT}`);
if (summary.fail > 0) {
  console.log("\n== BUGS FOUND ==");
  findings.filter((f) => f.severity === "FAIL").forEach((f) => console.log(`  ✗ [${f.area}] ${f.msg}`));
  process.exit(1);
} else {
  console.log("\n✅ NO CRITICAL BUGS");
  process.exit(0);
}
