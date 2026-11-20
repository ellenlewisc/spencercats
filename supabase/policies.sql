-- Browser keys get no table access; only the API routes, using the RLS-bypassing secret key, read or write.

alter table public."CatImages" enable row level security;
alter table public."CatImages" force row level security;

revoke all on table public."CatImages" from anon, authenticated;

-- Photos are served from the public bucket URL; writes only happen through the API with the secret key.
update storage.buckets
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
where id = 'cat-images';

-- Check for leftovers: both queries should return no rows that grant anon/authenticated write access.
select policyname, cmd, roles from pg_policies where schemaname = 'public' and tablename = 'CatImages';
select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects';
