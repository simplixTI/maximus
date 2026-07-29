// Supabase Edge Function — stripe-webhook
//
// Receives Stripe events and mirrors them into the DB. This is the
// SOURCE OF TRUTH for whether a payment succeeded — do not rely on the
// client-side redirect from stripe-checkout, because the browser can be
// closed before it fires.
//
// Configure in Stripe Dashboard → Developers → Webhooks:
//   Endpoint: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events:
//     - checkout.session.completed
//     - payment_intent.succeeded
//     - payment_intent.payment_failed
//     - charge.refunded
//   Copy the signing secret (whsec_...) and set:
//     supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const STRIPE_WEBHOOK_SIGNING_SECRET = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// -----------------------------------------------------------------------------
// Signature verification (Web Crypto — Deno-native, no npm dep)
// -----------------------------------------------------------------------------

const encoder = new TextEncoder();

async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!header) return { ok: false, reason: "missing Stripe-Signature header" };
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return { ok: false, reason: "malformed header" };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > toleranceSeconds) {
    return { ok: false, reason: "timestamp outside tolerance" };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const a = encoder.encode(expected);
  const b = encoder.encode(signature);
  if (a.length !== b.length) return { ok: false, reason: "signature mismatch" };
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return { ok: false, reason: "signature mismatch" };
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Supabase REST helpers (service_role — bypasses RLS)
// -----------------------------------------------------------------------------

const sbHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

async function sbSelect(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: sbHeaders(),
  });
  return res.ok ? await res.json() : [];
}

async function sbInsert(table: string, row: Record<string, unknown>, prefer = "return=representation,resolution=ignore-duplicates") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: prefer },
    body: JSON.stringify(row),
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
}

async function sbUpdate(table: string, query: string, patch: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: sbHeaders(),
    body: JSON.stringify(patch),
  });
  return { ok: res.ok, status: res.status };
}

// -----------------------------------------------------------------------------
// Event handlers
// -----------------------------------------------------------------------------

interface CheckoutSession {
  id: string;
  amount_total: number;
  currency: string;
  payment_intent: string | null;
  customer: string | null;
  metadata: {
    quote_id?: string;
    request_id?: string;
    client_id?: string;
    provider_id?: string;
  };
}

interface PaymentIntent {
  id: string;
  amount: number;
  status: string;
  metadata: {
    quote_id?: string;
    booking_id?: string;
  };
}

interface Charge {
  id: string;
  payment_intent: string;
  amount_refunded: number;
  refunded: boolean;
}

async function handleCheckoutCompleted(session: CheckoutSession): Promise<void> {
  const { quote_id, request_id, client_id, provider_id } = session.metadata;
  if (!quote_id || !request_id || !client_id) {
    console.warn("checkout.session.completed missing metadata", session.id);
    return;
  }

  // 1. Idempotency: skip if booking already exists for this quote
  const existing = (await sbSelect("bookings", `quote_id=eq.${quote_id}&select=id`)) as Array<{ id: string }>;
  if (existing.length > 0) {
    console.log(`Booking already exists for quote ${quote_id}, skipping create`);
    // Still ensure payment record exists (below)
    await ensurePaymentRecord(existing[0].id, session);
    return;
  }

  // 2. Mark quote as accepted
  await sbUpdate("quotes", `id=eq.${quote_id}`, { status: "accepted" });

  // 3. Create booking (status confirmed regardless of provider assignment)
  const bookingInsert = await sbInsert("bookings", {
    request_id,
    quote_id,
    client_id,
    provider_id: provider_id ?? null,
    status: "confirmed",
  });
  const bookingRow = Array.isArray(bookingInsert.body) ? bookingInsert.body[0] : bookingInsert.body;
  const bookingId = bookingRow?.id as string | undefined;

  // 4. Update service_request status
  await sbUpdate("service_requests", `id=eq.${request_id}`, {
    status: provider_id ? "matched" : "paid",
  });

  // 5. Record payment
  if (bookingId) await ensurePaymentRecord(bookingId, session);

  // 6. Notifications
  if (provider_id) {
    await sbInsert("notifications", {
      user_id: provider_id,
      type: "provider_assigned",
      title: "New job assigned",
      body: "A client has booked you. Open the app to review details.",
    });
  }
  await sbInsert("notifications", {
    user_id: client_id,
    type: "quote_accepted",
    title: "Booking confirmed",
    body: "Your payment succeeded. We're matching you with a provider now.",
  });
}

async function ensurePaymentRecord(bookingId: string, session: CheckoutSession): Promise<void> {
  if (!session.payment_intent) return;
  await sbInsert("payments", {
    booking_id: bookingId,
    stripe_payment_intent_id: session.payment_intent,
    amount: session.amount_total / 100,
    currency: session.currency,
    status: "succeeded",
  });
}

async function handlePaymentIntentSucceeded(pi: PaymentIntent): Promise<void> {
  // Idempotent — if already inserted, this update is a no-op
  await sbUpdate(
    "payments",
    `stripe_payment_intent_id=eq.${pi.id}`,
    { status: "succeeded" },
  );
}

async function handlePaymentIntentFailed(pi: PaymentIntent): Promise<void> {
  await sbUpdate(
    "payments",
    `stripe_payment_intent_id=eq.${pi.id}`,
    { status: "failed" },
  );
}

async function handleChargeRefunded(charge: Charge): Promise<void> {
  await sbUpdate(
    "payments",
    `stripe_payment_intent_id=eq.${charge.payment_intent}`,
    { status: "refunded", refunded_amount: charge.amount_refunded / 100 },
  );
}

// -----------------------------------------------------------------------------
// HTTP entry
// -----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!STRIPE_WEBHOOK_SIGNING_SECRET) {
    return new Response(JSON.stringify({ error: "STRIPE_WEBHOOK_SIGNING_SECRET not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.text();
  const sigHeader = req.headers.get("Stripe-Signature");

  const verify = await verifyStripeSignature(payload, sigHeader, STRIPE_WEBHOOK_SIGNING_SECRET);
  if (!verify.ok) {
    console.warn("Signature verification failed:", verify.reason);
    return new Response(JSON.stringify({ error: verify.reason }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: { type: string; data: { object: unknown } };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as CheckoutSession);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Charge);
        break;
      default:
        // Acknowledge unknown events so Stripe doesn't retry indefinitely
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (e) {
    console.error(`Handler failed for ${event.type}:`, e);
    // Return 500 so Stripe retries with exponential backoff
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
