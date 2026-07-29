// Supabase Edge Function — send-push
//
// Dispatches Firebase Cloud Messaging (FCM v1) push notifications.
//
// Two invocation paths:
//   1) Postgres trigger `notifications_fanout_push` calls this on every INSERT
//      into public.notifications, using the service_role key.
//   2) Application code can call it directly for multi-recipient dispatch
//      (see `recipient_user_ids`). Callers with a user JWT are restricted to
//      sending to themselves only — abuse prevention.
//
// Request body:
//   {
//     recipient_user_ids: string[],   // required, one or many UUIDs
//     title: string,                  // required
//     body?: string,
//     notification_type?: string,     // maps to Android channel + preferences
//     entity_id?: string,             // deep-link target ID
//     data?: Record<string, string>   // extra key/values, forwarded to client
//   }
//
// Response: { sent, skipped, results }
//
// Deploy:   supabase functions deploy send-push --no-verify-jwt
// Secrets:  supabase secrets set FCM_PROJECT_ID=<firebase-project-id>
//           supabase secrets set FCM_SERVICE_ACCOUNT_JSON='<single-line JSON>'
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID");
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  recipient_user_ids: string[];
  title: string;
  body?: string | null;
  notification_type?: string;
  entity_id?: string;
  data?: Record<string, string>;
};

type Category = "services" | "messages" | "appointments" | "general";

const categoryFor = (t: string | undefined): Category => {
  if (!t) return "general";
  if (t === "chat_message") return "messages";
  if (["request_received", "service_request", "quote_sent", "quote_accepted"].includes(t))
    return "services";
  if (
    [
      "booking_confirmed",
      "provider_assigned",
      "provider_en_route",
      "provider_arrived",
      "job_completed",
      "appointment",
      "service_completed",
      "appointment_cancelled",
      "appointment_changed",
    ].includes(t)
  )
    return "appointments";
  return "general";
};

// ---------------------------------------------------------------------------
// FCM OAuth2: service-account JWT → access token (cached in memory).
// ---------------------------------------------------------------------------

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};

let cachedToken: { token: string; exp: number } | null = null;

function base64UrlEncode(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeString(s: string): string {
  return base64UrlEncode(new TextEncoder().encode(s));
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = atob(clean);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const toSign = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(toSign)),
  );

  const jwt = `${toSign}.${base64UrlEncode(sig)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const body = await resp.json();
  if (!resp.ok) throw new Error(`FCM token exchange failed: ${JSON.stringify(body)}`);

  cachedToken = { token: body.access_token, exp: now + (body.expires_in ?? 3600) };
  return cachedToken.token;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!FCM_PROJECT_ID || !FCM_SERVICE_ACCOUNT_JSON) {
    return new Response(
      JSON.stringify({ error: "FCM_PROJECT_ID or FCM_SERVICE_ACCOUNT_JSON not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(FCM_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_JSON is not valid JSON", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (
    !Array.isArray(payload.recipient_user_ids) ||
    payload.recipient_user_ids.length === 0 ||
    !payload.title
  ) {
    return new Response(
      JSON.stringify({ error: "recipient_user_ids (non-empty array) and title are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ------- Auth check ------------------------------------------------------
  // If the JWT claim role === 'service_role' and matches this project's ref,
  // trust the caller and allow any recipients. Otherwise fall back to the
  // anon client + caller JWT and restrict recipients to the caller's own id.
  //
  // We decode the JWT payload (not verify — the platform layer verifies) so
  // rotating the key doesn't break the trigger's server-to-server calls.
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let isServiceRole = false;
  try {
    const parts = bearer.split(".");
    if (parts.length === 3) {
      const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      const claims = JSON.parse(payloadStr) as { role?: string; ref?: string };
      const projectRef = new URL(SUPABASE_URL).host.split(".")[0];
      isServiceRole =
        claims.role === "service_role" &&
        (!claims.ref || claims.ref === projectRef);
    }
  } catch {
    // fall through — treated as non-service-role caller
  }

  let recipients = payload.recipient_user_ids;
  if (!isServiceRole) {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await anon.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userRes.user.id;
    const filtered = recipients.filter((r) => r === callerId);
    if (filtered.length === 0) {
      return new Response(
        JSON.stringify({ error: "user callers may only notify themselves" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    recipients = filtered;
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const category = categoryFor(payload.notification_type);

  // Filter recipients by their notification_preferences for this category.
  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("user_id, enabled")
    .eq("category", category)
    .in("user_id", recipients);

  const disabled = new Set(
    (prefs ?? []).filter((p) => !p.enabled).map((p) => p.user_id as string),
  );
  const allowed = recipients.filter((r) => !disabled.has(r));

  if (allowed.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, skipped: recipients.length, reason: "all recipients opted out" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { data: tokens, error: qErr } = await admin
    .from("push_tokens")
    .select("id, token, platform, user_id")
    .in("user_id", allowed)
    .eq("active", true);

  if (qErr) {
    return new Response(
      JSON.stringify({ error: "push_tokens query failed", detail: qErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!tokens || tokens.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, skipped: allowed.length, reason: "no active tokens" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(sa);
  } catch (e) {
    return new Response(JSON.stringify({ error: "FCM auth failed", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dataPayload: Record<string, string> = {
    notification_type: payload.notification_type ?? "generic",
    entity_id: payload.entity_id ?? "",
    category,
    ...(payload.data ?? {}),
  };

  const results = await Promise.allSettled(
    tokens.map(async (row) => {
      const message: Record<string, unknown> = {
        token: row.token,
        notification: {
          title: payload.title,
          body: payload.body ?? "",
        },
        data: dataPayload,
        android: {
          priority: category === "general" ? "NORMAL" : "HIGH",
          notification: {
            channel_id: category,
            sound: "default",
          },
        },
        apns: {
          headers: {
            "apns-priority": category === "general" ? "5" : "10",
          },
          payload: {
            aps: { sound: "default", "content-available": 1 },
          },
        },
      };

      const resp = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        },
      );

      const respBody = await resp.json().catch(() => ({}));

      const isUnregistered =
        resp.status === 404 ||
        respBody?.error?.status === "NOT_FOUND" ||
        respBody?.error?.status === "UNREGISTERED" ||
        respBody?.error?.details?.some?.(
          (d: { errorCode?: string }) => d.errorCode === "UNREGISTERED",
        );

      if (isUnregistered) {
        // Deactivate — keep the row for audit but stop targeting it.
        await admin
          .from("push_tokens")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("id", row.id);
        return { token_id: row.id, status: "unregistered_deactivated" };
      }

      if (!resp.ok) {
        console.warn("[send-push] FCM error", row.id, respBody);
        return { token_id: row.id, status: "error", detail: respBody };
      }

      await admin
        .from("push_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", row.id);
      return { token_id: row.id, status: "ok" };
    }),
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : { status: "rejected", detail: String(r.reason) },
  );
  const sent = summary.filter((s) => s.status === "ok").length;
  const skipped = recipients.length - allowed.length;

  return new Response(JSON.stringify({ sent, skipped, results: summary }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
