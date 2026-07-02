-- Allow clients to insert their own booking when accepting a quote.
--
-- Root cause: 0001_init.sql only had "bookings: admin write" (FOR ALL) — no
-- INSERT path for clients. useAcceptQuote in the SPA fires as authenticated
-- client and tries to insert a bookings row, which failed with
-- "new row violates row-level security policy for table bookings" and the
-- toast "Failed to accept quote".
--
-- SELECT / UPDATE paths were already fine (participants read, provider
-- status update). Admin's FOR ALL policy remains intact.
create policy "bookings: client insert own"
  on public.bookings for insert
  with check (auth.uid() = client_id);
