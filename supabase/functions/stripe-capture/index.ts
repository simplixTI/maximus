// Supabase Edge Function — stripe-capture
// Captures the held payment when a job is marked completed. Reads the
// PaymentIntent id from the payments row keyed by booking_id and calls
// Stripe /capture. Updates payments.status on success/failure.
//
// Invoke:
//   await supabase.functions.invoke("stripe-capture", { body: { booking_id } });

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!STRIPE_SECRET_KEY) return json(500, { error: "STRIPE_SECRET_KEY not configured" });

  try {
    const body = (await req.json()) as { booking_id: string };
    if (!body.booking_id) return json(400, { error: "Missing booking_id" });

    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?booking_id=eq.${body.booking_id}&select=id,stripe_payment_intent_id,status`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    const rows = (await pRes.json()) as Array<{
      id: string;
      stripe_payment_intent_id: string | null;
      status: string;
    }>;
    const payment = rows?.[0];
    if (!payment) return json(404, { error: "No payment row for this booking" });
    if (!payment.stripe_payment_intent_id)
      return json(400, { error: "Payment has no stripe_payment_intent_id" });
    if (payment.status === "captured")
      return json(200, { already: true, payment_id: payment.id });

    const capRes = await fetch(
      `https://api.stripe.com/v1/payment_intents/${payment.stripe_payment_intent_id}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const pi = await capRes.json();

    const newStatus = capRes.status >= 400 ? "failed" : "captured";
    await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${payment.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (capRes.status >= 400) return json(capRes.status, pi);
    return json(200, { captured: true, payment_id: payment.id, payment_intent: pi.id });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
