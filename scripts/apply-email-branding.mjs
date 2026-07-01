// Applies branded HTML email templates to Supabase Auth via the Management API.
// Also enables mailer_autoconfirm=true.
// Usage: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-email-branding.mjs

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.PROJECT_REF ?? "kcryjyznkxaoclrmbadi";

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN env var");
  process.exit(1);
}

const LOGO_URL = "https://maximussolutions.app/icons/icon-192.png";

function shell({ title, body, cta, url }) {
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
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">${title}</h2>
        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">${body}</p>
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:12px;box-shadow:0 8px 24px rgba(249,115,22,0.4);">${cta}</a>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">If the button doesn't work, copy this link:<br/><a href="${url}" style="color:#ea580c;word-break:break-all;">${url}</a></p>
      </div>
      <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">You're receiving this because you have an active Maximus account.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const payload = {
  mailer_autoconfirm: true,
  mailer_subjects_confirmation: "Welcome to Maximus — confirm your email",
  mailer_subjects_magic_link: "Your Maximus sign-in link",
  mailer_subjects_recovery: "Reset your Maximus password",
  mailer_subjects_email_change: "Confirm your new email address",
  mailer_subjects_invite: "You've been invited to Maximus",
  mailer_subjects_reauthentication: "Confirm your identity",

  mailer_templates_confirmation_content: shell({
    title: "Confirm your email",
    body: "Welcome aboard! Please confirm your email to activate your Maximus account and start requesting services.",
    cta: "Confirm email",
    url: "{{ .ConfirmationURL }}",
  }),

  mailer_templates_magic_link_content: shell({
    title: "Your sign-in link",
    body: "Click below to sign in to Maximus. This link expires in 1 hour.",
    cta: "Sign in to Maximus",
    url: "{{ .ConfirmationURL }}",
  }),

  mailer_templates_recovery_content: shell({
    title: "Reset your password",
    body: "We got your request to reset your Maximus password. Click below to choose a new one. If you didn't request this, ignore this email.",
    cta: "Reset password",
    url: "{{ .ConfirmationURL }}",
  }),

  mailer_templates_email_change_content: shell({
    title: "Confirm your new email",
    body: "Confirm the change from <b>{{ .Email }}</b> to <b>{{ .NewEmail }}</b>.",
    cta: "Confirm change",
    url: "{{ .ConfirmationURL }}",
  }),

  mailer_templates_invite_content: shell({
    title: "You've been invited",
    body: "Welcome to Maximus. Accept your invitation to create your account.",
    cta: "Accept invitation",
    url: "{{ .ConfirmationURL }}",
  }),

  mailer_templates_reauthentication_content: shell({
    title: "Confirm your identity",
    body: "Enter the following code to confirm reauthentication: <b>{{ .Token }}</b>",
    cta: "Open Maximus",
    url: "https://maximussolutions.app/login",
  }),
};

const resp = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await resp.json();
console.log("Status:", resp.status);
console.log("autoconfirm:", result.mailer_autoconfirm);
console.log("confirmation subject:", result.mailer_subjects_confirmation);
console.log("magic_link subject:", result.mailer_subjects_magic_link);
console.log("recovery subject:", result.mailer_subjects_recovery);
if (resp.status >= 400) {
  console.error(result);
  process.exit(1);
}
console.log("\n✓ Branded templates applied to Supabase Auth.");
