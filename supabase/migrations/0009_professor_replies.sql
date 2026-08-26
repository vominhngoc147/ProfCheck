-- Migration 0009: professor replies to reviews (right-of-reply, D7 Phase 3)

create table public.professor_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  professor_id uuid not null references public.professors(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_prof_replies_review on public.professor_replies(review_id);

alter table public.professor_replies enable row level security;

create policy "replies_select_all" on public.professor_replies
  for select using (true);

create policy "replies_insert_owner" on public.professor_replies
  for insert with check (
    exists (
      select 1 from public.professors p
      where p.id = professor_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "replies_update_owner" on public.professor_replies
  for update using (
    exists (
      select 1 from public.professors p
      where p.id = professor_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "replies_delete_owner" on public.professor_replies
  for delete using (
    exists (
      select 1 from public.professors p
      where p.id = professor_id and p.owner_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );
