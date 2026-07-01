// Supabase Edge Function — send-email
// Sends transactional email via Resend HTTP API.
// Deploy:   supabase functions deploy send-email --no-verify-jwt
// Secret:   supabase secrets set RESEND_API_KEY=re_xxx
//           supabase secrets set EMAIL_FROM="Maximus <no-reply@yourdomain.com>"
//
// Invoke from client:
//   await supabase.functions.invoke("send-email", {
//     body: { to, subject, html, template?, data? }
//   });

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Maximus <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: "quote_sent" | "quote_accepted" | "request_received" | "generic";
  data?: Record<string, unknown>;
  reply_to?: string;
};

function renderTemplate(name: Payload["template"], data: Record<string, unknown> = {}): { subject: string; html: string } {
  const brandHead = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
      <div style="border-radius: 16px; overflow: hidden; border: 1px solid #eee;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 28px 24px; color: white;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Maximus Solutions Group</h1>
        </div>
        <div style="padding: 28px 24px; background: white;">`;
  const brandFoot = `
        </div>
        <div style="padding: 16px 24px; background: #fafafa; font-size: 12px; color: #888;">
          You're receiving this because you have an active Maximus account.
        </div>
      </div>
    </div>`;

  switch (name) {
    case "quote_sent": {
      const amount = data.amount ?? "—";
      const category = data.category ?? "your request";
      return {
        subject: `New quote ready: $${amount}`,
        html: `${brandHead}
          <h2 style="margin: 0 0 8px; font-size: 18px;">Your quote is ready</h2>
          <p style="margin: 0 0 16px; color: #555;">We've priced <b>${category}</b> at</p>
          <div style="font-size: 32px; font-weight: 800; color: #ea580c;">$${amount}</div>
          <p style="margin: 16px 0 0; color: #555;">Open the app to review scope and accept.</p>
          ${brandFoot}`,
      };
    }
    case "quote_accepted": {
      return {
        subject: "Booking confirmed",
        html: `${brandHead}
          <h2 style="margin: 0 0 8px; font-size: 18px;">You're booked!</h2>
          <p style="margin: 0 0 16px; color: #555;">Your quote was accepted and a provider will be dispatched shortly.</p>
          ${brandFoot}`,
      };
    }
    case "request_received": {
      const category = data.category ?? "your service";
      return {
        subject: "We got your request",
        html: `${brandHead}
          <h2 style="margin: 0 0 8px; font-size: 18px;">Request received</h2>
          <p style="margin: 0 0 16px; color: #555;">Thanks — we're preparing a quote for <b>${category}</b> and will notify you shortly.</p>
          ${brandFoot}`,
      };
    }
    default:
      return {
        subject: (data.subject as string) ?? "Notification",
        html: `${brandHead}<p>${(data.body as string) ?? ""}</p>${brandFoot}`,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Payload;
    let { subject, html } = body;
    if (body.template) {
      const t = renderTemplate(body.template, body.data ?? {});
      subject = subject ?? t.subject;
      html = html ?? t.html;
    }
    if (!body.to || !subject) {
      return new Response(JSON.stringify({ error: "Missing to/subject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: body.to,
        subject,
        html,
        text: body.text,
        reply_to: body.reply_to,
      }),
    });

    const payload = await resp.json();
    return new Response(JSON.stringify(payload), {
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
