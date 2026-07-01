# Supabase — Maximus Solutions Group

## Setup (Dashboard)

1. Create a new Supabase project.
2. **SQL Editor** → paste contents of `migrations/0001_init.sql` → Run.
3. **Authentication → Providers** → enable Email (magic link or password).
4. Create demo users via **Authentication → Users → Add user**:
   - `admin@maximus.dev`
   - `client@maximus.dev`
   - `provider@maximus.dev`
5. Copy each user's UUID and replace the placeholder IDs in `seed.sql`, then run it.
6. **Storage** → create buckets: `avatars` (public), `provider-docs` (private), `job-photos` (private).
7. **Project Settings → API** → copy `URL` and `anon` key into `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Setup (CLI, optional)

```bash
npm i -g supabase
supabase login
supabase link --project-ref xxxxx
supabase db push
```

## Regenerate types

After schema changes, regenerate the typed `Database` interface:

```bash
supabase gen types typescript --project-id xxxxx --schema public > src/lib/database.types.ts
```

## Realtime channels

Enabled on:
- `bookings` (status changes)
- `booking_status_events` (client tracking)
- `chat_messages` (live chat)
- `notifications` (in-app)
- `provider_profiles` (online + location)

## Matching RPC

```ts
const { data } = await supabase.rpc("providers_within_radius", {
  lat: 25.7617,
  lng: -80.1918,
  radius_m: 20000,
});
```

## Email via Resend

Transactional emails (quote sent, quote accepted, request received) go through the
`send-email` Edge Function, which calls the Resend HTTP API. Auth emails
(confirm signup, magic link, password reset) should be routed through Resend
by configuring SMTP in the Supabase Dashboard.

### 1. Deploy the Edge Function

```bash
supabase functions deploy send-email --no-verify-jwt
```

### 2. Set secrets

```bash
supabase secrets set RESEND_API_KEY=re_UzasgooB_5Go73PYrS498kvEEp1CMZxVg
supabase secrets set EMAIL_FROM="Maximus <onboarding@resend.dev>"
```

Once you verify a real sending domain on Resend, replace the `EMAIL_FROM`
address (e.g. `Maximus <no-reply@maximus.com>`).

### 3. Route Auth emails through Resend (SMTP)

**Dashboard → Project Settings → Auth → SMTP Settings** → Enable Custom SMTP:

| Field    | Value                                           |
| -------- | ----------------------------------------------- |
| Host     | `smtp.resend.com`                               |
| Port     | `465`                                           |
| Username | `resend`                                        |
| Password | `re_UzasgooB_5Go73PYrS498kvEEp1CMZxVg`          |
| Sender email | `onboarding@resend.dev` (or your verified domain) |
| Sender name  | `Maximus`                                   |

Save. From now on, every signup / magic-link / reset email sent by Supabase
Auth is delivered by Resend instead of Supabase's default SMTP.

### 4. Verify

```bash
supabase functions invoke send-email --body '{
  "to": "you@example.com",
  "template": "quote_sent",
  "data": { "amount": "250.00", "category": "plumbing" }
}'
```
