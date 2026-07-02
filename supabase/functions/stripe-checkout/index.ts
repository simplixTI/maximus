// Supabase Edge Function — stripe-checkout
// Creates a Stripe Checkout Session for the client to authorize payment.
// capture_method=manual → funds held, not captured until job completes.
// application_fee_amount=30% → platform keeps 30%, 70% goes to provider's
// Connect account IF one exists. If no Connect account yet, the full
// amount flows to the platform (to be reconciled manually later).
//
// Invoke:
//   await supabase.functions.invoke("stripe-checkout", {
//     body: { quote_id, provider_id?, success_url?, cancel_url? }
//   });
// Returns: { url, session_id }

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
    const body = (await req.json()) as {
      quote_id: string;
      provider_id?: string;
      success_url?: string;
      cancel_url?: string;
    };
    if (!body.quote_id) return json(400, { error: "Missing quote_id" });

    // Read quote + related data via service_role
    const qRes = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?id=eq.${body.quote_id}&select=id,amount,scope,request_id,request:service_requests(client_id,category,client:profiles(email,full_name))`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    const rows = (await qRes.json()) as Array<{
      id: string;
      amount: string | number;
      scope: string;
      request_id: string;
      request: {
        client_id: string;
        category: string;
        client: { email: string; full_name: string } | null;
      } | null;
    }>;
    const quote = rows?.[0];
    if (!quote) return json(404, { error: "Quote not found" });

    const amount = typeof quote.amount === "string" ? parseFloat(quote.amount) : quote.amount;
    const amountCents = Math.round(amount * 100);

    // MVP simplification: immediate capture (default), no split, no Connect.
    // Full amount goes to platform. Split + hold + provider Connect payout
    // to be added later.
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("payment_method_types[0]", "card");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(amountCents));
    params.set(
      "line_items[0][price_data][product_data][name]",
      `${quote.request?.category ?? "Service"} — Maximus`,
    );
    params.set("line_items[0][price_data][product_data][description]", quote.scope.slice(0, 200));
    params.set("line_items[0][quantity]", "1");
    params.set("payment_intent_data[metadata][quote_id]", quote.id);
    params.set("payment_intent_data[metadata][request_id]", quote.request_id);
    params.set("payment_intent_data[metadata][client_id]", quote.request?.client_id ?? "");
    if (body.provider_id) params.set("payment_intent_data[metadata][provider_id]", body.provider_id);
    if (quote.request?.client?.email) params.set("customer_email", quote.request.client.email);
    params.set("success_url", body.success_url ?? "https://www.maximussolutions.app/client/bookings?paid=1");
    params.set("cancel_url", body.cancel_url ?? "https://www.maximussolutions.app/client/bookings");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();
    if (stripeRes.status >= 400) return json(stripeRes.status, session);

    return json(200, { url: session.url, session_id: session.id });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
