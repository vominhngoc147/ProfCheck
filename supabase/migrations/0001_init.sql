-- ============================================================
-- ProfCheck — Migration 0001: schema, RLS, triggers, seed
-- VERSION MARKER: MIGRATION_V2_2026_08_26
-- ============================================================
select 'MIGRATION_V2_LOADED' as version_marker;


-- ============================================================
-- TABLES
-- ============================================================

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_vi text not null,
  name_en text not null,
  edu_domains text[] not null default '{}',
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  slug text not null,
  name_vi text not null,
  name_en text,
  unique (school_id, slug)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code text,
  name_vi text not null,
  unique (school_id, code)
);

create table public.professors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  faculty_id uuid references public.faculties(id),
  slug text not null,
  full_name text not null,
  academic_title text,
  avatar_url text,
  bio text,
  research_interests text[] not null default '{}',
  publications jsonb not null default '[]',
  accepting_students boolean not null default false,
  open_slots jsonb not null default '{}',
  source_status text not null default 'seed'
    check (source_status in ('seed','user_created','claimed')),
  owner_profile_id uuid, -- FK added after profiles table exists
  review_count int not null default 0,
  avg_overall numeric(3,2),
  avg_difficulty numeric(3,2),
  avg_fairness numeric(3,2),
  would_take_again_pct int,
  created_at timestamptz not null default now(),
  unique (school_id, slug)
);

create table public.professor_courses (
  professor_id uuid references public.professors(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  primary key (professor_id, course_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null default 'student' check (role in ('student','moderator','admin')),
  verification text not null default 'none'
    check (verification in ('none','edu_verified','card_pending','card_verified')),
  school_id uuid references public.schools(id),
  student_card_url text,
  created_at timestamptz not null default now()
);

alter table public.professors
  add constraint fk_professors_owner
  foreign key (owner_profile_id) references public.profiles(id);

create type public.review_status as enum ('pending','approved','rejected');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professors(id) on delete cascade,
  course_id uuid references public.courses(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default false,
  rating_overall smallint not null check (rating_overall between 1 and 5),
  rating_difficulty smallint not null check (rating_difficulty between 1 and 5),
  rating_fairness smallint not null check (rating_fairness between 1 and 5),
  would_take_again boolean,
  tags text[] not null default '{}',
  content text not null check (char_length(content) >= 30),
  advisor_type text check (advisor_type in ('nckh','kltn','luan_van','khac')),
  status public.review_status not null default 'pending',
  moderated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professor_id, author_id)
);
create index idx_reviews_professor on public.reviews (professor_id, status, created_at desc);

create table public.professor_claims (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professors(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  evidence_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (professor_id, claimant_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS (sau khi tạo bảng)
-- ============================================================

-- ===== Helper: staff check =====
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator','admin')
  );
$$;

-- ===== Auto-create profile on signup =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- D8 hybrid moderation: publish immediately; moderation is reactive.
-- Phase đầu mọi review được duyệt tự động. Khi có AI/keyword filter,
-- nội dung nghi vấn sẽ bị đặt lại 'pending' bởi hàm filter.
create or replace function public.enforce_review_status()
returns trigger
language plpgsql
as $$
begin
  new.status := 'approved';
  return new;
end;
$$;
create trigger trg_review_status before insert on public.reviews
for each row execute function public.enforce_review_status();

-- Recompute professor stats when approved reviews change
create or replace function public.refresh_professor_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.professor_id, old.professor_id);
begin
  update public.professors p set
    review_count = s.cnt,
    avg_overall = s.avg_o,
    avg_difficulty = s.avg_d,
    avg_fairness = s.avg_f,
    would_take_again_pct = s.wta
  from (
    select
      count(*)::int as cnt,
      round(avg(rating_overall)::numeric, 2) as avg_o,
      round(avg(rating_difficulty)::numeric, 2) as avg_d,
      round(avg(rating_fairness)::numeric, 2) as avg_f,
      coalesce(round(100.0 * count(*) filter (where would_take_again) / nullif(count(*),0))::int, 0) as wta
    from public.reviews
    where professor_id = pid and status = 'approved'
  ) s
  where p.id = pid;
  return null;
end;
$$;
create trigger trg_prof_stats after insert or update or delete on public.reviews
for each row execute function public.refresh_professor_stats();

-- Guard: non-admin cannot escalate role/verification on profiles
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    if new.role is distinct from old.role
       or new.verification is distinct from old.verification
       or new.student_card_url is distinct from old.student_card_url then
      raise exception 'Chỉ admin/moderator được thay đổi quyền hoặc trạng thái xác thực';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_profile_guard before update on public.profiles
for each row execute function public.guard_profile_update();

-- Auto edu verification on signup email domain match
create or replace function public.try_edu_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dom text;
  em text;
  sch record;
begin
  select email into em from auth.users where id = new.id;
  if em is null then return new; end if;
  dom := split_part(em, '@', 2);
  for sch in select * from public.schools where dom = any(edu_domains) loop
    new.verification := 'edu_verified';
    new.school_id := sch.id;
  end loop;
  return new;
end;
$$;
create trigger trg_profile_edu_verify before insert or update of id on public.profiles
for each row execute function public.try_edu_verification();

-- ============================================================
-- VIEWS
-- ============================================================

-- Public review list: NEVER exposes author identity of anonymous reviews
create view public.public_reviews
with (security_invoker = true) as
select
  r.id, r.professor_id, r.course_id, r.is_anonymous,
  r.rating_overall, r.rating_difficulty, r.rating_fairness,
  r.would_take_again, r.tags, r.content, r.advisor_type,
  r.status, r.created_at, r.updated_at,
  case when r.is_anonymous then null else r.author_id end as author_id,
  case when r.is_anonymous then null else pr.display_name end as author_name,
  case when r.is_anonymous then null else pr.avatar_url end as author_avatar
from public.reviews r
join public.profiles pr on pr.id = r.author_id;

-- Safe profile projection for showing named reviewers
create view public.public_profiles
with (security_invoker = true) as
select id, display_name, avatar_url
from public.profiles;

-- ============================================================
-- RLS
-- ============================================================
alter table public.schools enable row level security;
alter table public.faculties enable row level security;
alter table public.courses enable row level security;
alter table public.professors enable row level security;
alter table public.professor_courses enable row level security;
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.professor_claims enable row level security;
alter table public.reports enable row level security;

-- schools / faculties / courses: public read, admin write
create policy "schools_read" on public.schools for select using (is_active or public.is_staff());
create policy "schools_admin" on public.schools for all using (public.is_staff()) with check (public.is_staff());
create policy "faculties_read" on public.faculties for select using (true);
create policy "faculties_admin" on public.faculties for all using (public.is_staff()) with check (public.is_staff());
create policy "courses_read" on public.courses for select using (true);
create policy "courses_admin" on public.courses for all using (public.is_staff()) with check (public.is_staff());

-- professors: public read; admin full; claimed owner limited via trigger below
create policy "prof_read" on public.professors for select using (true);
create policy "prof_admin" on public.professors for all using (public.is_staff()) with check (public.is_staff());
create policy "prof_owner_update" on public.professors for update
  using (source_status = 'claimed' and owner_profile_id = auth.uid())
  with check (source_status = 'claimed' and owner_profile_id = auth.uid());
create policy "prof_user_create" on public.professors for insert
  with check (auth.uid() is not null and source_status = 'user_created');

-- Restrict which columns a claiming professor may edit
create or replace function public.guard_professor_owner_update()
returns trigger
language plpgsql
as $$
begin
  if not public.is_staff() then
    new.source_status := old.source_status;
    new.owner_profile_id := old.owner_profile_id;
    new.review_count := old.review_count;
    new.avg_overall := old.avg_overall;
    new.avg_difficulty := old.avg_difficulty;
    new.avg_fairness := old.avg_fairness;
    new.would_take_again_pct := old.would_take_again_pct;
    new.school_id := old.school_id;
    new.slug := old.slug;
    new.full_name := old.full_name;
  end if;
  return new;
end;
$$;
create trigger trg_prof_owner_guard before update on public.professors
for each row execute function public.guard_professor_owner_update();

create policy "pc_read" on public.professor_courses for select using (true);
create policy "pc_admin" on public.professor_courses for all using (public.is_staff()) with check (public.is_staff());

-- profiles: read own + staff (public names go through public_profiles view)
create policy "prof_select" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy "prof_insert_own" on public.profiles for insert
  with check (id = auth.uid());
create policy "prof_update_own" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- reviews: see approved + own; write requires verified account
create policy "rev_select" on public.reviews for select
  using (status = 'approved' or author_id = auth.uid() or public.is_staff());
create policy "rev_insert" on public.reviews for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and verification <> 'none'
    )
  );
create policy "rev_update_own" on public.reviews for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "rev_delete_own_or_admin" on public.reviews for delete
  using (author_id = auth.uid() or public.is_staff());
create policy "rev_moderate" on public.reviews for update
  using (public.is_staff()) with check (public.is_staff());

-- claims: read own + staff; insert own pending
create policy "claim_select" on public.professor_claims for select
  using (claimant_id = auth.uid() or public.is_staff());
create policy "claim_insert" on public.professor_claims for insert
  with check (claimant_id = auth.uid() and status = 'pending');
create policy "claim_admin" on public.professor_claims for update
  using (public.is_staff()) with check (public.is_staff());

-- reports
create policy "report_select" on public.reports for select
  using (reporter_id = auth.uid() or public.is_staff());
create policy "report_insert" on public.reports for insert
  with check (reporter_id = auth.uid());
create policy "report_admin" on public.reports for update
  using (public.is_staff()) with check (public.is_staff());

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('student-cards', 'student-cards', false)
on conflict (id) do nothing;

create policy "avatar_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatar_upload_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "card_upload_own" on storage.objects for insert
  with check (bucket_id = 'student-cards' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "card_read_own_or_staff" on storage.objects for select
  using (bucket_id = 'student-cards' and ((auth.uid()::text = (storage.foldername(name))[1]) or public.is_staff()));

-- ============================================================
-- SEED: FTU — Trường Luật & Khoa Khoa học Chính trị
-- ============================================================
insert into public.schools (slug, name_vi, name_en, edu_domains)
values ('ftu', 'Trường Đại học Ngoại thương', 'Foreign Trade University', '{ftu.edu.vn}')
on conflict (slug) do nothing;

with s as (select id from public.schools where slug = 'ftu')
insert into public.faculties (school_id, slug, name_vi, name_en)
select s.id, v.slug, v.name_vi, v.name_en from s, (values
  ('truong-luat', 'Trường Luật', 'School of Law'),
  ('khoa-khoa-hoc-chinh-tri', 'Khoa Khoa học Chính trị', 'Faculty of Political Science')
) as v(slug, name_vi, name_en)
on conflict do nothing;
