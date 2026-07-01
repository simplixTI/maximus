-- Maximus Solutions Group — initial schema
-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- ============================================================================
-- Enums
-- ============================================================================
create type user_role as enum ('client', 'provider', 'admin');
create type membership_tier as enum ('essential', 'plus', 'premium');
create type request_status as enum ('draft', 'quoted', 'paid', 'matched', 'in_progress', 'completed', 'cancelled');
create type quote_status as enum ('pending', 'accepted', 'declined', 'revision_requested', 'expired');
create type booking_status as enum ('confirmed', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled');
create type payment_status as enum ('pending', 'authorized', 'captured', 'refunded', 'failed');
create type document_status as enum ('pending', 'verified', 'rejected', 'expired');

-- ============================================================================
-- profiles (1-1 with auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  full_name text,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- Auto-create profile row when auth.users row inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- client_profiles
-- ============================================================================
create table public.client_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  address text,
  city text,
  state text,
  zip text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- provider_profiles (with PostGIS location for matching)
-- ============================================================================
create table public.provider_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  ein text,
  address text,
  city text,
  state text,
  zip text,
  bio text,
  verified boolean not null default false,
  online boolean not null default false,
  current_location geography(Point, 4326),
  rating_avg numeric(3,2) not null default 0,
  jobs_completed integer not null default 0,
  stripe_account_id text,
  created_at timestamptz not null default now()
);

create index provider_profiles_verified_online_idx
  on public.provider_profiles(verified, online);
create index provider_profiles_location_idx
  on public.provider_profiles using gist(current_location);

-- ============================================================================
-- provider_documents
-- ============================================================================
create table public.provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  type text not null,
  file_url text not null,
  status document_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index provider_documents_provider_idx on public.provider_documents(provider_id);

-- ============================================================================
-- provider_skills
-- ============================================================================
create table public.provider_skills (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  skill text not null,
  license_url text,
  license_status document_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index provider_skills_provider_idx on public.provider_skills(provider_id);
create index provider_skills_skill_idx on public.provider_skills(skill);

-- ============================================================================
-- service_requests (with PostGIS location)
-- ============================================================================
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  description text not null,
  address text not null,
  location geography(Point, 4326),
  photos text[] not null default '{}',
  status request_status not null default 'draft',
  scheduled_at timestamptz,
  estimated_cost numeric(10,2),
  created_at timestamptz not null default now()
);

create index service_requests_client_idx on public.service_requests(client_id);
create index service_requests_status_idx on public.service_requests(status);
create index service_requests_location_idx on public.service_requests using gist(location);

-- ============================================================================
-- quotes
-- ============================================================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  admin_id uuid references public.profiles(id),
  amount numeric(10,2) not null,
  scope text not null,
  notes text,
  status quote_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index quotes_request_idx on public.quotes(request_id);
create index quotes_status_idx on public.quotes(status);

-- ============================================================================
-- bookings
-- ============================================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  quote_id uuid not null references public.quotes(id),
  client_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid references public.provider_profiles(user_id),
  status booking_status not null default 'confirmed',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index bookings_client_idx on public.bookings(client_id);
create index bookings_provider_idx on public.bookings(provider_id);
create index bookings_status_idx on public.bookings(status);

-- ============================================================================
-- booking_status_events
-- ============================================================================
create table public.booking_status_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status booking_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create index booking_status_events_booking_idx on public.booking_status_events(booking_id);

-- ============================================================================
-- payments
-- ============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  provider_payout numeric(10,2) not null,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index payments_booking_idx on public.payments(booking_id);
create index payments_status_idx on public.payments(status);

-- ============================================================================
-- reviews
-- ============================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_id)
);

create index reviews_reviewee_idx on public.reviews(reviewee_id);

-- Maintain provider rating_avg
create or replace function public.recalc_provider_rating()
returns trigger language plpgsql as $$
begin
  update public.provider_profiles
    set rating_avg = coalesce((
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r
      where r.reviewee_id = new.reviewee_id
    ), 0)
    where user_id = new.reviewee_id;
  return new;
end;
$$;

create trigger reviews_recalc_rating
  after insert or update on public.reviews
  for each row execute function public.recalc_provider_rating();

-- ============================================================================
-- memberships
-- ============================================================================
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier membership_tier not null,
  stripe_subscription_id text unique,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index memberships_user_idx on public.memberships(user_id);

-- ============================================================================
-- chat_messages
-- ============================================================================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_booking_created_idx
  on public.chat_messages(booking_id, created_at);

-- ============================================================================
-- notifications
-- ============================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_read_idx on public.notifications(user_id, read);

-- ============================================================================
-- RPC: providers_within_radius (matching)
-- ============================================================================
create or replace function public.providers_within_radius(
  lat double precision,
  lng double precision,
  radius_m double precision
)
returns table (
  provider_id uuid,
  business_name text,
  rating_avg numeric,
  distance_m double precision
)
language sql stable as $$
  select
    pp.user_id as provider_id,
    pp.business_name,
    pp.rating_avg,
    st_distance(pp.current_location, st_makepoint(lng, lat)::geography) as distance_m
  from public.provider_profiles pp
  where pp.verified = true
    and pp.online = true
    and pp.current_location is not null
    and st_dwithin(pp.current_location, st_makepoint(lng, lat)::geography, radius_m)
  order by distance_m asc;
$$;

-- ============================================================================
-- Helper: is_admin()
-- ============================================================================
create or replace function public.is_admin(u uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles where id = u and role = 'admin');
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_documents enable row level security;
alter table public.provider_skills enable row level security;
alter table public.service_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_events enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.memberships enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "profiles: self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles: self update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: admin all" on public.profiles
  for all using (public.is_admin(auth.uid()));

-- client_profiles
create policy "client_profiles: self" on public.client_profiles
  for all using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- provider_profiles
create policy "provider_profiles: public read verified" on public.provider_profiles
  for select using (verified = true or auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "provider_profiles: self update" on public.provider_profiles
  for update using (auth.uid() = user_id);
create policy "provider_profiles: self insert" on public.provider_profiles
  for insert with check (auth.uid() = user_id);
create policy "provider_profiles: admin all" on public.provider_profiles
  for all using (public.is_admin(auth.uid()));

-- provider_documents / skills
create policy "provider_documents: owner or admin" on public.provider_documents
  for all using (auth.uid() = provider_id or public.is_admin(auth.uid()));
create policy "provider_skills: public read" on public.provider_skills
  for select using (true);
create policy "provider_skills: owner write" on public.provider_skills
  for all using (auth.uid() = provider_id or public.is_admin(auth.uid()));

-- service_requests
create policy "service_requests: client owner" on public.service_requests
  for all using (auth.uid() = client_id or public.is_admin(auth.uid()));
create policy "service_requests: matched provider read" on public.service_requests
  for select using (
    exists (
      select 1 from public.bookings b
      where b.request_id = service_requests.id
        and b.provider_id = auth.uid()
    )
  );

-- quotes
create policy "quotes: client of request" on public.quotes
  for select using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = quotes.request_id and sr.client_id = auth.uid()
    ) or public.is_admin(auth.uid())
  );
create policy "quotes: admin write" on public.quotes
  for all using (public.is_admin(auth.uid()));
create policy "quotes: client update status" on public.quotes
  for update using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = quotes.request_id and sr.client_id = auth.uid()
    )
  );

-- bookings
create policy "bookings: participants" on public.bookings
  for select using (
    auth.uid() = client_id
    or auth.uid() = provider_id
    or public.is_admin(auth.uid())
  );
create policy "bookings: admin write" on public.bookings
  for all using (public.is_admin(auth.uid()));
create policy "bookings: provider update status" on public.bookings
  for update using (auth.uid() = provider_id);

-- booking_status_events
create policy "booking_status_events: participants read" on public.booking_status_events
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_status_events.booking_id
        and (auth.uid() = b.client_id or auth.uid() = b.provider_id)
    ) or public.is_admin(auth.uid())
  );
create policy "booking_status_events: provider insert" on public.booking_status_events
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_status_events.booking_id
        and (auth.uid() = b.provider_id or public.is_admin(auth.uid()))
    )
  );

-- payments
create policy "payments: participants read" on public.payments
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and (auth.uid() = b.client_id or auth.uid() = b.provider_id)
    ) or public.is_admin(auth.uid())
  );
create policy "payments: admin write" on public.payments
  for all using (public.is_admin(auth.uid()));

-- reviews
create policy "reviews: public read" on public.reviews
  for select using (true);
create policy "reviews: participant write" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- memberships
create policy "memberships: owner" on public.memberships
  for all using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- chat_messages
create policy "chat_messages: booking participants" on public.chat_messages
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = chat_messages.booking_id
        and (auth.uid() = b.client_id or auth.uid() = b.provider_id)
    )
  );
create policy "chat_messages: sender insert" on public.chat_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.bookings b
      where b.id = chat_messages.booking_id
        and (auth.uid() = b.client_id or auth.uid() = b.provider_id)
    )
  );

-- notifications
create policy "notifications: owner" on public.notifications
  for all using (auth.uid() = user_id);

-- ============================================================================
-- Realtime
-- ============================================================================
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.booking_status_events;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.provider_profiles;
