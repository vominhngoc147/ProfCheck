-- Migration 0017: professor profile extensions (dot 1) + search-ready columns (dot 2)
-- D13-D20: degrees/titles/awards/research_fields/allow_forum_reup,
-- reviews purpose+program, multi-review per professor (D14),
-- auto-sync professor_courses from course_code, professor-avatars bucket.

-- ===== 1. professors: new profile columns =====
alter table public.professors
  add column if not exists degrees text[] not null default '{}',
  add column if not exists titles text[] not null default '{}',
  add column if not exists awards jsonb not null default '[]',
  add column if not exists research_fields text[] not null default '{}',
  add column if not exists allow_forum_reup boolean not null default true;

-- ===== 2. reviews: purpose + program (search filters, dot 2) =====
alter table public.reviews
  add column if not exists purpose text not null default 'hoc_tap'
    check (purpose in ('hoc_tap','nckh','kltn','ttgk')),
  add column if not exists program text
    check (program in ('clc','cttt','dhnnqt','chinh_quy','khac')),
  add column if not exists allow_forum_reup boolean not null default true;

grant select (purpose) on public.reviews to anon, authenticated;
grant select (program) on public.reviews to anon, authenticated;
grant insert (purpose) on public.reviews to authenticated;
grant insert (program) on public.reviews to authenticated;
grant insert (allow_forum_reup) on public.reviews to authenticated;

-- ===== 3. D14: one student may review one professor MULTIPLE times
-- (different course / different purpose). Replace unique(professor_id, author_id)
-- with unique(professor_id, author_id, purpose, normalized course_code).
alter table public.reviews
  drop constraint if exists reviews_professor_id_author_id_key;
drop index if exists public.reviews_professor_id_author_id_key;
create unique index if not exists reviews_one_per_course_purpose
  on public.reviews (professor_id, author_id, purpose, (lower(coalesce(course_code, ''))));

-- ===== 4. Auto-sync professor_courses from reviews.course_code =====
create or replace function public.sync_professor_courses()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_school uuid;
  v_course uuid;
begin
  v_code := nullif(trim(coalesce(new.course_code, '')), '');
  if v_code is null then return new; end if;

  select school_id into v_school from public.professors where id = new.professor_id;
  if v_school is null then return new; end if;

  insert into public.courses (school_id, code, name_vi)
  values (v_school, upper(v_code), upper(v_code))
  on conflict (school_id, code) do nothing;

  select id into v_course from public.courses
  where school_id = v_school and code = upper(v_code);

  if v_course is not null then
    insert into public.professor_courses (professor_id, course_id)
    values (new.professor_id, v_course)
    on conflict do nothing;
    -- link review to course row when missing
    if new.course_id is null then
      new.course_id := v_course;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_professor_courses on public.reviews;
create trigger trg_sync_professor_courses
before insert or update of course_code on public.reviews
for each row execute function public.sync_professor_courses();

-- professors owner update: allow new profile cols, keep protecting stats/identity.
-- Also fix: avg_clarity (added in 0011) was never guarded.
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
    new.avg_clarity := old.avg_clarity;
    new.would_take_again_pct := old.would_take_again_pct;
    new.school_id := old.school_id;
    new.slug := old.slug;
    new.full_name := old.full_name;
  end if;
  return new;
end;
$$;

-- ===== 5. professor-avatars bucket (public, 2MB Soft limit enforced in app) =====
insert into storage.buckets (id, name, public) values
  ('professor-avatars', 'professor-avatars', true)
on conflict (id) do nothing;

drop policy if exists "prof_avatar_public_read" on storage.objects;
create policy "prof_avatar_public_read" on storage.objects for select
  using (bucket_id = 'professor-avatars');

drop policy if exists "prof_avatar_upload" on storage.objects;
create policy "prof_avatar_upload" on storage.objects for insert
  with check (bucket_id = 'professor-avatars' and auth.uid() is not null);

drop policy if exists "prof_avatar_update_own" on storage.objects;
create policy "prof_avatar_update_own" on storage.objects for update
  using (bucket_id = 'professor-avatars' and auth.uid() is not null);

drop policy if exists "prof_avatar_delete_own" on storage.objects;
create policy "prof_avatar_delete_own" on storage.objects for delete
  using (bucket_id = 'professor-avatars' and (public.is_staff() or auth.uid() is not null));

-- ===== 6. keep public_reviews view in sync =====
drop view if exists public.public_reviews;
create view public.public_reviews
with (security_invoker = false) as
select
  r.id, r.professor_id, r.course_id, r.is_anonymous,
  r.rating_overall, r.rating_difficulty, r.rating_fairness, r.rating_clarity,
  r.attendance_required, r.textbook_used, r.for_credit,
  r.would_take_again, r.tags, r.content, r.advisor_type, r.course_code,
  r.purpose, r.program, r.allow_forum_reup,
  r.status, r.created_at, r.updated_at,
  case when r.is_anonymous then null else r.author_id end as author_id,
  case when r.is_anonymous then null else pr.display_name end as author_name,
  case when r.is_anonymous then null else pr.avatar_url end as author_avatar
from public.reviews r
join public.profiles pr on pr.id = r.author_id
where r.status = 'approved';

grant select on public.public_reviews to anon, authenticated;
revoke insert, update, delete, truncate on public.public_reviews from anon;
revoke insert, update, delete, truncate on public.public_reviews from authenticated;
