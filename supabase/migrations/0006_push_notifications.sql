-- Push notifications: device token registry, per-category preferences, and
-- auto-fanout trigger that dispatches every INSERT on public.notifications
-- to the send-push edge function.
--
-- One-time setup after applying this migration (Supabase Managed doesn't allow
-- `alter database ... set app.xxx` — we use Supabase Vault for the secret and
-- hardcode the (non-secret) function URL inside the trigger below).
--
-- Studio → SQL editor:
--   do $$
--   declare
--     existing_id uuid;
--   begin
--     select id into existing_id from vault.secrets where name = 'push_service_role_key';
--     if existing_id is null then
--       perform vault.create_secret('<service-role-jwt>', 'push_service_role_key', 'Bearer used by fanout_notification_push trigger');
--     else
--       perform vault.update_secret(existing_id, '<service-role-jwt>', 'push_service_role_key', 'Bearer used by fanout_notification_push trigger');
--     end if;
--   end $$;
--
-- NOTE: raw INSERT/UPDATE on vault.secrets is blocked in managed Supabase —
-- always go through vault.create_secret() / vault.update_secret() functions.
--
-- If the vault secret is missing the trigger is a no-op so INSERTs never break.

create extension if not exists pg_net;

-- ============================================================================
-- push_tokens
-- ============================================================================
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios', 'web')),
  device_id text,
  app_version text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index push_tokens_user_active_idx
  on public.push_tokens(user_id, active) where active = true;

alter table public.push_tokens enable row level security;

-- Owner-only: user can insert/update/select their own tokens; nobody else,
-- not even other authenticated users, may read them.
create policy "push_tokens: owner read" on public.push_tokens
  for select using (auth.uid() = user_id);
create policy "push_tokens: owner insert" on public.push_tokens
  for insert with check (auth.uid() = user_id);
create policy "push_tokens: owner update" on public.push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_tokens: owner delete" on public.push_tokens
  for delete using (auth.uid() = user_id);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

-- ============================================================================
-- notification_preferences — per-user opt-in/out by category (channel).
-- Categories mirror the Android notification channels created client-side.
-- ============================================================================
create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('services', 'messages', 'appointments', 'general')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences: owner all" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Map a notification `type` value (from public.notifications.type) to a
-- push category / Android channel. Kept in Postgres so the trigger and the
-- edge function agree on the mapping.
create or replace function public.notification_category_for(t text)
returns text
language sql immutable as $$
  select case
    when t in ('chat_message') then 'messages'
    when t in ('request_received', 'service_request', 'quote_sent', 'quote_accepted') then 'services'
    when t in (
      'booking_confirmed', 'provider_assigned', 'provider_en_route',
      'provider_arrived', 'job_completed', 'appointment', 'service_completed',
      'appointment_cancelled', 'appointment_changed'
    ) then 'appointments'
    else 'general'
  end;
$$;

-- ============================================================================
-- Trigger: fan out INSERTs on notifications to the send-push edge function.
-- Fires async via pg_net.http_post — the INSERT does not wait for delivery.
-- Payload shape matches the edge function's `recipient_user_ids` API.
-- ============================================================================
create or replace function public.fanout_notification_push()
returns trigger
language plpgsql
security definer set search_path = public, extensions, vault
as $$
declare
  fn_url text := 'https://kcryjyznkxaoclrmbadi.supabase.co/functions/v1/send-push';
  svc_key text;
begin
  select decrypted_secret into svc_key
    from vault.decrypted_secrets
   where name = 'push_service_role_key'
   limit 1;

  if svc_key is null or svc_key = '' then
    return new;
  end if;

  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body := jsonb_build_object(
      'recipient_user_ids', jsonb_build_array(new.user_id),
      'title',              new.title,
      'body',               new.body,
      'notification_type',  new.type,
      'entity_id',          new.id,
      'data',               jsonb_build_object(
                              'notification_id', new.id::text,
                              'notification_type', new.type
                            )
    )
  );
  return new;
end;
$$;

create trigger notifications_fanout_push
  after insert on public.notifications
  for each row execute function public.fanout_notification_push();
