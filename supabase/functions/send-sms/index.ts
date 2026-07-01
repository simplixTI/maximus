// Supabase Edge Function — send-sms
// Sends transactional SMS via Twilio Messages API.
// Deploy:   supabase functions deploy send-sms --no-verify-jwt
// Secrets:
//   supabase secrets set TWILIO_ACCOUNT_SID=ACxxx
//   supabase secrets set TWILIO_AUTH_TOKEN=xxx
//   supabase secrets set TWILIO_FROM=+15551234567   # or MG... Messaging Service SID
//
// Invoke:
//   await supabase.functions.invoke("send-sms", { body: { to, template, data } });

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM = Deno.env.get("TWILIO_FROM"); // phone number OR MG... service SID

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Template =
  | "welcome"
  | "request_received"
  | "quote_sent"
  | "quote_accepted"
  | "booking_confirmed"
  | "provider_assigned"
  | "provider_en_route"
  | "provider_arrived"
  | "job_completed"
  | "generic";

type Payload = {
  to: string;
  body?: string;
  template?: Template;
  data?: Record<string, unknown>;
};

function renderTemplate(name: Template | undefined, data: Record<string, unknown> = {}): string {
  switch (name) {
    case "welcome":
      return `Maximus: Welcome${data.name ? `, ${data.name}` : ""}! Your account is ready. Request a service anytime from the app.`;
    case "request_received":
      return `Maximus: We got your ${data.category ?? "service"} request. A quote will arrive shortly.`;
    case "quote_sent":
      return `Maximus: Your quote of $${data.amount ?? "—"} for ${data.category ?? "your request"} is ready. Open the app to accept.`;
    case "quote_accepted":
      return `Maximus: Booking confirmed. We're matching you with the best provider now.`;
    case "booking_confirmed":
      return `Maximus: Your booking is confirmed for ${data.when ?? "the scheduled time"}. Track live in the app.`;
    case "provider_assigned":
      return `Maximus: ${data.provider ?? "A provider"} has accepted your job. You'll hear from them soon.`;
    case "provider_en_route":
      return `Maximus: ${data.provider ?? "Your provider"} is on the way. ETA: ${data.eta ?? "shortly"}.`;
    case "provider_arrived":
      return `Maximus: ${data.provider ?? "Your provider"} has arrived at the location.`;
    case "job_completed":
      return `Maximus: Your ${data.category ?? "service"} is complete. Please rate your provider in the app.`;
    default:
      return (data.body as string) ?? "Notification from Maximus.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return new Response(
      JSON.stringify({
        error:
          "Twilio env not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM)",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const payload = (await req.json()) as Payload;
    if (!payload.to) {
      return new Response(JSON.stringify({ error: "Missing 'to' phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = payload.body ?? renderTemplate(payload.template, payload.data ?? {});

    const form = new URLSearchParams();
    form.set("To", payload.to);
    form.set("Body", body);
    if (TWILIO_FROM.startsWith("MG")) {
      form.set("MessagingServiceSid", TWILIO_FROM);
    } else {
      form.set("From", TWILIO_FROM);
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );

    const result = await resp.json();
    return new Response(JSON.stringify(result), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
