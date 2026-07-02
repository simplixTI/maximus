-- Add service_requests + quotes to Supabase Realtime publication so admin
-- pages (AdminQuotes, AdminDashboard live activity) receive INSERT/UPDATE
-- events pushed instantly instead of relying on 30-45s polling refetch.
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.quotes;
