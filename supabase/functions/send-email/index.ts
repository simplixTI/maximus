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
  template?: "welcome" | "quote_sent" | "quote_accepted" | "request_received" | "generic";
  data?: Record<string, unknown>;
  reply_to?: string;
};

const LOGO_URL = "https://maximussolutions.app/icons/icon-192.png";
const APP_URL = "https://maximussolutions.app";

function shell(inner: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 20px 60px rgba(249,115,22,0.15);">
      <div style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:40px 32px;text-align:center;">
        <img src="${LOGO_URL}" alt="Maximus" width="72" height="72" style="border-radius:16px;display:block;margin:0 auto 16px;"/>
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Maximus Solutions Group</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">Trusted home services, on demand.</p>
      </div>
      <div style="padding:40px 32px;">${inner}</div>
      <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">You're receiving this because you have an active Maximus account.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:12px;box-shadow:0 8px 24px rgba(249,115,22,0.4);">${label}</a>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">${text}</h2>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">${text}</p>`;
}

function bigAmount(amount: string): string {
  return `<div style="margin:16px 0 24px;padding:24px;border-radius:16px;background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,88,12,0.04));text-align:center;">
    <div style="font-size:14px;color:#9ca3af;font-weight:500;margin-bottom:4px;">Quote total</div>
    <div style="font-size:40px;font-weight:800;color:#ea580c;letter-spacing:-1px;">$${amount}</div>
  </div>`;
}

function renderTemplate(name: Payload["template"], data: Record<string, unknown> = {}): { subject: string; html: string } {
  switch (name) {
    case "welcome": {
      const name_ = (data.name as string) ?? "there";
      return {
        subject: "Welcome to Maximus 🎉",
        html: shell(
          heading(`Hi ${name_}, welcome to Maximus`) +
            para("Your account is ready. Maximus connects you with vetted local pros for any home service — plumbing, electrical, HVAC, painting, and more. Request a job in under 60 seconds.") +
            `<div style="text-align:center;">${btn(APP_URL + "/client/request", "Request a service")}</div>` +
            `<div style="margin:32px 0 0;padding:20px;border-radius:12px;background:#f9fafb;border-left:3px solid #f97316;">
              <div style="font-weight:600;color:#111827;margin-bottom:8px;">How it works</div>
              <div style="color:#4b5563;font-size:14px;line-height:1.7;">
                1. Tell us what you need<br/>
                2. We send you a quote<br/>
                3. Accept and track your provider live<br/>
                4. Pay securely, rate the job
              </div>
            </div>`,
        ),
      };
    }
    case "quote_sent": {
      const amount = String(data.amount ?? "—");
      const category = data.category ?? "your request";
      return {
        subject: `New quote ready: $${amount}`,
        html: shell(
          heading("Your quote is ready") +
            para(`We've priced your <b>${category}</b> request. Review the scope and accept in the app to book.`) +
            bigAmount(amount) +
            `<div style="text-align:center;">${btn(APP_URL + "/client/bookings", "Review & accept")}</div>`,
        ),
      };
    }
    case "quote_accepted": {
      return {
        subject: "Booking confirmed",
        html: shell(
          heading("You're booked! 🎉") +
            para("Your quote was accepted. We're matching you with the best available provider — you'll get a notification the moment they're on the way.") +
            `<div style="text-align:center;">${btn(APP_URL + "/client/bookings", "View booking")}</div>`,
        ),
      };
    }
    case "request_received": {
      const category = data.category ?? "your service";
      return {
        subject: "We got your request",
        html: shell(
          heading("Request received") +
            para(`Thanks — we're preparing a quote for <b>${category}</b>. Our team typically responds within a couple of hours.`) +
            `<div style="text-align:center;">${btn(APP_URL + "/client/dashboard", "Open Maximus")}</div>`,
        ),
      };
    }
    default: {
      const subject = (data.subject as string) ?? "Maximus notification";
      const body = (data.body as string) ?? "";
      return {
        subject,
        html: shell(
          heading(subject) +
            para(body) +
            `<div style="text-align:center;">${btn(APP_URL, "Open Maximus")}</div>`,
        ),
      };
    }
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
