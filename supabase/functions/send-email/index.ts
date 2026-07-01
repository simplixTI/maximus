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

const LOGO_URL = "https://maximussolutions.app/logo.png";
const APP_URL = "https://maximussolutions.app";

// Brand palette derived from Maximus logo:
//   NAVY (buildings)   #0F2547 → deep, primary backdrop
//   NAVY MID          #1B3966 → gradient step
//   GOLD (arrow)      #D4A24A → sharp accent
//   GOLD LIGHT        #F0C866 → highlight
//   CHAMPAGNE (text)  #EFE5CC → warm off-white
//   PAPER (card)      #FDFBF6 → warm paper for body

function shell(inner: string, opts: { preheader?: string } = {}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Georgia','Times New Roman',serif;">
  ${opts.preheader ? `<span style="display:none;opacity:0;visibility:hidden;height:0;width:0;overflow:hidden;">${opts.preheader}</span>` : ""}
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Masthead: navy backdrop, gold hairline, centered wordmark -->
    <div style="background:linear-gradient(180deg,#0F2547 0%,#1B3966 100%);padding:44px 32px 36px;text-align:center;border-radius:20px 20px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr><td align="center">
          <img src="${LOGO_URL}" alt="Maximus Solutions Group" width="130" style="display:block;margin:0 auto;"/>
        </td></tr>
      </table>
      <div style="margin-top:20px;height:1px;background:linear-gradient(90deg,transparent 0%,#D4A24A 50%,transparent 100%);"></div>
      <p style="margin:14px 0 0;color:#D4A24A;font-family:'Georgia',serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:400;">Trusted Property Services</p>
    </div>

    <!-- Body: warm paper card -->
    <div style="background:#FDFBF6;padding:44px 36px 40px;border-radius:0 0 20px 20px;font-family:'Georgia','Times New Roman',serif;">
      ${inner}
    </div>

    <!-- Footer -->
    <div style="padding:24px 20px 8px;text-align:center;">
      <p style="margin:0;color:rgba(239,229,204,0.55);font-size:11px;font-family:'Georgia',serif;letter-spacing:0.5px;">
        Maximus Solutions Group &middot; Trusted home services, on demand
      </p>
      <p style="margin:6px 0 0;color:rgba(239,229,204,0.35);font-size:10px;font-family:Arial,sans-serif;">
        You're receiving this because you have an active Maximus account.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border-collapse:collapse;"><tr><td style="background:#0F2547;">
    <a href="${href}" style="display:inline-block;padding:16px 40px;color:#F0C866;text-decoration:none;font-family:'Georgia',serif;font-size:13px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;border:1px solid #D4A24A;">${label}</a>
  </td></tr></table>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 6px;color:#0F2547;font-family:'Georgia','Times New Roman',serif;font-size:28px;font-weight:400;letter-spacing:-0.5px;line-height:1.2;">${text}</h2>
  <div style="height:1px;width:36px;background:#D4A24A;margin:14px 0 20px;"></div>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 18px;color:#3D4B5C;font-family:'Georgia',serif;font-size:15px;line-height:1.75;">${text}</p>`;
}

function bigAmount(amount: string): string {
  return `<div style="margin:22px 0 28px;padding:28px 20px;border:1px solid rgba(212,162,74,0.35);background:linear-gradient(135deg,rgba(212,162,74,0.06) 0%,rgba(240,200,102,0.02) 100%);text-align:center;">
    <div style="font-family:'Georgia',serif;font-size:10px;color:#8B7A55;font-weight:400;margin-bottom:8px;letter-spacing:2.5px;text-transform:uppercase;">Quote Total</div>
    <div style="font-family:'Georgia',serif;font-size:44px;font-weight:400;color:#0F2547;letter-spacing:-1px;line-height:1;">$${amount}</div>
    <div style="margin-top:10px;height:1px;width:24px;background:#D4A24A;display:inline-block;"></div>
  </div>`;
}

function infoBlock(title: string, lines: string[]): string {
  return `<div style="margin:32px 0 0;padding:22px 24px;background:#F5F0E4;border-left:2px solid #D4A24A;">
    <div style="font-family:'Georgia',serif;font-weight:700;color:#0F2547;font-size:12px;margin-bottom:12px;letter-spacing:1.5px;text-transform:uppercase;">${title}</div>
    <div style="color:#3D4B5C;font-family:'Georgia',serif;font-size:14px;line-height:2;">
      ${lines.join("<br/>")}
    </div>
  </div>`;
}

function renderTemplate(name: Payload["template"], data: Record<string, unknown> = {}): { subject: string; html: string } {
  switch (name) {
    case "welcome": {
      const name_ = (data.name as string) ?? "there";
      return {
        subject: "Welcome to Maximus",
        html: shell(
          heading(`Welcome, ${name_}`) +
            para("Your Maximus account is ready. We connect discerning property owners with vetted, insured professionals across plumbing, electrical, HVAC, painting, and every home service in between. Every job is coordinated, tracked, and stood behind.") +
            `<div style="margin:28px 0;text-align:center;">${btn(APP_URL + "/client/request", "Request a service")}</div>` +
            infoBlock("How it works", [
              "01 &nbsp;&nbsp; Tell us what you need",
              "02 &nbsp;&nbsp; We prepare and send a quote",
              "03 &nbsp;&nbsp; Accept and track your provider live",
              "04 &nbsp;&nbsp; Pay securely and rate the job",
            ]),
          { preheader: `Welcome to Maximus, ${name_} — your account is ready.` },
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
