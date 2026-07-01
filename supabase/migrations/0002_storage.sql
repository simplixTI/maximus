-- Storage buckets + RLS policies for Maximus
-- Run once after 0001_init.sql

-- ============================================================================
-- Buckets
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('provider-docs', 'provider-docs', false),
  ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

-- ============================================================================
-- Policies (path convention: <user_id>/<filename>)
-- ============================================================================

-- avatars: public read, owner write
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- provider-docs: private, owner + admin read/write
create policy "provider-docs: owner read"
  on storage.objects for select
  using (
    bucket_id = 'provider-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin(auth.uid())
    )
  );

create policy "provider-docs: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "provider-docs: owner update"
  on storage.objects for update
  using (
    bucket_id = 'provider-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin(auth.uid())
    )
  );

create policy "provider-docs: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'provider-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- job-photos: any authenticated user can read + write
-- Path convention: <booking_id>/<uuid>-<filename>
create policy "job-photos: auth read"
  on storage.objects for select
  using (
    bucket_id = 'job-photos'
    and auth.role() = 'authenticated'
  );

create policy "job-photos: auth upload"
  on storage.objects for insert
  with check (
    bucket_id = 'job-photos'
    and auth.role() = 'authenticated'
  );
