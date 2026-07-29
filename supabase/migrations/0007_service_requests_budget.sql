-- Add client-declared budget estimate to service requests. Nullable at the
-- DB level so historical rows (created before this feature) stay valid;
-- the client UI enforces required going forward.

alter table public.service_requests
  add column if not exists estimated_budget numeric(10,2);

comment on column public.service_requests.estimated_budget is
  'Client-declared budget in USD entered on the Schedule step. Required at the UI level; nullable in the DB for backfill safety.';
