-- Maximus Solutions Group — seed data (synthetic, for local/dev only)
-- Note: rows in auth.users must be created via Supabase Auth (Dashboard or CLI).
-- This seed assumes three demo auth users already exist with these IDs.
-- Replace UUIDs below with real ones from your Supabase Auth users, OR run
-- the "Create demo users" snippet in supabase/README.md first.

-- Demo IDs (synthetic)
-- 00000000-0000-0000-0000-000000000001  admin@maximus.dev
-- 00000000-0000-0000-0000-000000000002  client@maximus.dev
-- 00000000-0000-0000-0000-000000000003  provider@maximus.dev

-- Promote admin
update public.profiles
  set role = 'admin', full_name = 'Max Admin'
  where id = '00000000-0000-0000-0000-000000000001';

-- Client profile
update public.profiles
  set full_name = 'Casey Client'
  where id = '00000000-0000-0000-0000-000000000002';

insert into public.client_profiles (user_id, address, city, state, zip)
values ('00000000-0000-0000-0000-000000000002', '123 Ocean Dr', 'Miami', 'FL', '33139')
on conflict (user_id) do nothing;

-- Provider (approved + online, Miami downtown)
update public.profiles
  set role = 'provider', full_name = 'Paul Provider'
  where id = '00000000-0000-0000-0000-000000000003';

insert into public.provider_profiles (
  user_id, business_name, ein, address, city, state, zip, bio,
  verified, online, current_location, rating_avg, jobs_completed
) values (
  '00000000-0000-0000-0000-000000000003',
  'Paul''s Home Services LLC',
  '12-3456789',
  '500 Biscayne Blvd',
  'Miami',
  'FL',
  '33132',
  'Licensed general contractor with 10+ years experience.',
  true,
  true,
  st_makepoint(-80.1918, 25.7617)::geography,
  4.85,
  42
) on conflict (user_id) do nothing;

insert into public.provider_skills (provider_id, skill, license_status)
values
  ('00000000-0000-0000-0000-000000000003', 'plumbing', 'verified'),
  ('00000000-0000-0000-0000-000000000003', 'electrical', 'verified'),
  ('00000000-0000-0000-0000-000000000003', 'painting', 'pending');

-- Sample service request (paid, ready to match)
with req as (
  insert into public.service_requests (
    client_id, category, description, address, location, status, estimated_cost
  ) values (
    '00000000-0000-0000-0000-000000000002',
    'plumbing',
    'Leaking kitchen sink, needs replacement of P-trap.',
    '123 Ocean Dr, Miami, FL 33139',
    st_makepoint(-80.1300, 25.7700)::geography,
    'paid',
    250.00
  ) returning id
), q as (
  insert into public.quotes (request_id, admin_id, amount, scope, status)
  select id, '00000000-0000-0000-0000-000000000001', 250.00,
         'Diagnose + replace P-trap + labor (1 hr).', 'accepted'
    from req
  returning id, request_id
)
insert into public.bookings (request_id, quote_id, client_id, provider_id, status)
select q.request_id, q.id,
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       'confirmed'
  from q;
