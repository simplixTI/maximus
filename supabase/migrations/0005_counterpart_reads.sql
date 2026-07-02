-- Allow booking counterparts (client ↔ provider) to read each other's profile
-- and the shared quote. Bug surfaced in production: provider job detail
-- showed "Client" with a "?" avatar and "$0.00" as Pay because the profiles
-- SELECT policy in 0001_init.sql only exposed the owner's own row, and quotes
-- SELECT only exposed the client of the request — provider (post-assignment)
-- had no read path. Result was 403s on the joined selects in useBooking.
--
-- Scoped tight: SELECT allowed only where there's an actual bookings row
-- linking the two identities. No cross-tenant leak.

create policy "profiles: booking counterparts read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.bookings b
      where (b.client_id = auth.uid() and b.provider_id = profiles.id)
         or (b.provider_id = auth.uid() and b.client_id = profiles.id)
    )
  );

create policy "quotes: booking participants read"
  on public.quotes for select
  using (
    exists (
      select 1 from public.bookings b
      where b.quote_id = quotes.id
        and (b.client_id = auth.uid() or b.provider_id = auth.uid())
    )
  );
