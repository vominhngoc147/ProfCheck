-- Migration 0010: school ratings (RMP-style campus ratings)

create table public.school_ratings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating_quality smallint not null check (rating_quality between 1 and 5),
  rating_social smallint not null check (rating_social between 1 and 5),
  rating_facilities smallint not null check (rating_facilities between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);

alter table public.school_ratings enable row level security;

create policy "school_ratings_select_all" on public.school_ratings
  for select using (true);

create policy "school_ratings_insert_verified" on public.school_ratings
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );

create policy "school_ratings_update_own" on public.school_ratings
  for update using (user_id = auth.uid());
