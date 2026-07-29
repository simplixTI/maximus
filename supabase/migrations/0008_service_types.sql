-- Service types (a.k.a. service categories) — admin-managed lookup that drives
-- the category chips in the client request flow. Keeping this in a table lets
-- ops add categories (e.g. "Solar Install", "EV Charger") without a deploy.
--
-- Note: public.service_requests.category is left as free-text (not a FK).
-- Historic requests already reference categories by string, and enforcing a
-- FK would break rows created before this migration.

create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  -- URL-safe machine id, matches values already stored in service_requests.category
  slug text not null unique check (slug = lower(slug) and slug !~ '[^a-z0-9-]'),
  label text not null,
  icon text,                 -- lucide-react icon component name, e.g. 'Wrench'
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_types_active_sort_idx
  on public.service_types(active, sort_order) where active = true;

alter table public.service_types enable row level security;

-- Anyone (even anon) can read the active list so the client request flow
-- works pre-login on the marketing site. Admins additionally see inactives.
drop policy if exists "service_types: public read active" on public.service_types;
create policy "service_types: public read active" on public.service_types
  for select using (active = true or public.is_admin(auth.uid()));

-- Only admins can create / update / delete.
drop policy if exists "service_types: admin write" on public.service_types;
create policy "service_types: admin write" on public.service_types
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop trigger if exists service_types_updated_at on public.service_types;
create trigger service_types_updated_at
  before update on public.service_types
  for each row execute function public.set_updated_at();

-- Seed with the categories currently hardcoded in src/components/request/StepDetails.tsx.
-- ON CONFLICT keeps existing rows untouched if re-run.
insert into public.service_types (slug, label, icon, sort_order) values
  ('plumbing',            'Plumbing',            'Wrench',       10),
  ('electrical',          'Electrical',          'Zap',          20),
  ('hvac',                'HVAC',                'Thermometer',  30),
  ('roofing',             'Roofing',             'Home',         40),
  ('painting',            'Painting',            'Paintbrush',   50),
  ('flooring',            'Flooring',            'LayoutGrid',   60),
  ('landscaping',         'Landscaping',         'Trees',        70),
  ('cleaning',            'Cleaning',            'Sparkles',     80),
  ('pest-control',        'Pest Control',        'Bug',          90),
  ('carpentry',           'Carpentry',           'Hammer',      100),
  ('appliance-repair',    'Appliance Repair',    'Refrigerator',110),
  ('general-maintenance', 'General Maintenance', 'Wrench',      120)
on conflict (slug) do nothing;
