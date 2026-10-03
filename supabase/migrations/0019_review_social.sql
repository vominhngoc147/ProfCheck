-- Migration 0019: review social (dot 4) — comments, saved, custom tags, attachments.

-- ===== 1. review_comments (thread 1 cap duoi moi review) =====
create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_comments_review on public.review_comments(review_id);

alter table public.review_comments enable row level security;

-- read: review da duyet thi ai cung doc; review pending chi author + staff
create policy "comments_select" on public.review_comments
  for select using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (r.status = 'approved' or r.author_id = auth.uid())
    )
    or public.is_staff()
  );

-- write: verified users only
create policy "comments_insert_verified" on public.review_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );

create policy "comments_delete_own_or_admin" on public.review_comments
  for delete using (author_id = auth.uid() or public.is_staff());

create policy "comments_update_own" on public.review_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

-- public view: mask identity when anonymous (same pattern as public_reviews)
create view public.public_review_comments
with (security_invoker = false) as
select
  c.id, c.review_id, c.content, c.is_anonymous, c.created_at,
  case when c.is_anonymous then null else c.author_id end as author_id,
  case when c.is_anonymous then null else pr.display_name end as author_name
from public.review_comments c
join public.profiles pr on pr.id = c.author_id;

grant select on public.public_review_comments to anon, authenticated;
revoke insert, update, delete, truncate on public.public_review_comments from anon;
revoke insert, update, delete, truncate on public.public_review_comments from authenticated;

-- ===== 2. saved_reviews (thu vien ca nhan) =====
create table public.saved_reviews (
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

alter table public.saved_reviews enable row level security;

create policy "saved_select_own" on public.saved_reviews
  for select using (user_id = auth.uid());
create policy "saved_insert_own" on public.saved_reviews
  for insert with check (user_id = auth.uid());
create policy "saved_delete_own" on public.saved_reviews
  for delete using (user_id = auth.uid());

-- ===== 3. custom_tags (quick tag tu tao) =====
create table public.custom_tags (
  id uuid primary key default gen_random_uuid(),
  label text unique not null check (char_length(label) between 1 and 30),
  created_by uuid references public.profiles(id) on delete set null,
  usage_count int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.custom_tags enable row level security;

create policy "ctags_select_all" on public.custom_tags
  for select using (true);
create policy "ctags_insert_verified" on public.custom_tags
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );

-- ===== 4. review_attachments (anh + tai lieu mon hoc) =====
create table public.review_attachments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'doc')),
  file_name text not null,
  file_size int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_attachments_review on public.review_attachments(review_id);

alter table public.review_attachments enable row level security;

create policy "attachments_select" on public.review_attachments
  for select using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (r.status = 'approved' or r.author_id = auth.uid())
    )
    or public.is_staff()
  );

create policy "attachments_insert_verified" on public.review_attachments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );

create policy "attachments_delete_own_or_admin" on public.review_attachments
  for delete using (author_id = auth.uid() or public.is_staff());

-- ===== 5. storage buckets (public de chia se, tranh signed-URL complexity) =====
insert into storage.buckets (id, name, public) values
  ('review-images', 'review-images', true),
  ('review-docs', 'review-docs', true)
on conflict (id) do nothing;

drop policy if exists "review_images_public_read" on storage.objects;
create policy "review_images_public_read" on storage.objects for select
  using (bucket_id = 'review-images');

drop policy if exists "review_images_upload" on storage.objects;
create policy "review_images_upload" on storage.objects for insert
  with check (bucket_id = 'review-images' and auth.uid() is not null);

drop policy if exists "review_images_delete" on storage.objects;
create policy "review_images_delete" on storage.objects for delete
  using (bucket_id = 'review-images' and (public.is_staff() or auth.uid() is not null));

drop policy if exists "review_docs_public_read" on storage.objects;
create policy "review_docs_public_read" on storage.objects for select
  using (bucket_id = 'review-docs');

drop policy if exists "review_docs_upload" on storage.objects;
create policy "review_docs_upload" on storage.objects for insert
  with check (bucket_id = 'review-docs' and auth.uid() is not null);

drop policy if exists "review_docs_delete" on storage.objects;
create policy "review_docs_delete" on storage.objects for delete
  using (bucket_id = 'review-docs' and (public.is_staff() or auth.uid() is not null));
