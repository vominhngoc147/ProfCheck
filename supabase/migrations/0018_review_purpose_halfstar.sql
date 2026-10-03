-- Migration 0018: purpose-based ratings + half-star scale (dot 3)
-- D13: 5 stars with 0.5 steps (0.5-5.0). D15/D16: per-purpose criteria.

-- ===== 1. rating cols smallint -> numeric(3,1) =====
alter table public.reviews
  alter column rating_overall type numeric(3,1) using rating_overall::numeric,
  alter column rating_difficulty type numeric(3,1) using rating_difficulty::numeric,
  alter column rating_fairness type numeric(3,1) using rating_fairness::numeric,
  alter column rating_clarity type numeric(3,1) using rating_clarity::numeric;

-- ===== 2. new criteria: expertise (chuyen mon) + support (ho tro/nhiet tinh) =====
alter table public.reviews
  add column if not exists rating_expertise numeric(3,1),
  add column if not exists rating_support numeric(3,1);

-- ===== 3. drop old integer checks (auto-generated names) =====
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and contype = 'c'
      and conname like 'reviews\_rating\_%\_check'
  loop
    execute format('alter table public.reviews drop constraint %I', c.conname);
  end loop;
end $$;

-- ===== 4. half-step checks: 0.5-5.0, multiples of 0.5 =====
alter table public.reviews
  drop constraint if exists reviews_ratings_halfstep;
alter table public.reviews
  add constraint reviews_ratings_halfstep check (
    rating_overall between 0.5 and 5.0
      and (rating_overall * 2) = floor(rating_overall * 2)
    and rating_difficulty between 0.5 and 5.0
      and (rating_difficulty * 2) = floor(rating_difficulty * 2)
    and rating_fairness between 0.5 and 5.0
      and (rating_fairness * 2) = floor(rating_fairness * 2)
    and (rating_clarity is null or (
      rating_clarity between 0.5 and 5.0
        and (rating_clarity * 2) = floor(rating_clarity * 2)))
    and (rating_expertise is null or (
      rating_expertise between 0.5 and 5.0
        and (rating_expertise * 2) = floor(rating_expertise * 2)))
    and (rating_support is null or (
      rating_support between 0.5 and 5.0
        and (rating_support * 2) = floor(rating_support * 2)))
  );

-- ===== 5. professors cached avgs for new criteria =====
alter table public.professors
  add column if not exists avg_expertise numeric(3,2),
  add column if not exists avg_support numeric(3,2);

-- ===== 6. owner-update guard: protect new stat cols =====
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
    new.avg_expertise := old.avg_expertise;
    new.avg_support := old.avg_support;
    new.would_take_again_pct := old.would_take_again_pct;
    new.school_id := old.school_id;
    new.slug := old.slug;
    new.full_name := old.full_name;
  end if;
  return new;
end;
$$;

-- ===== 7. stats trigger: include expertise/support =====
create or replace function public.refresh_professor_stats()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  target := coalesce(new.professor_id, old.professor_id);
  with s as (
    select round(avg(rating_overall)::numeric, 2) as avg_o,
           round(avg(rating_difficulty)::numeric, 2) as avg_d,
           round(avg(rating_fairness)::numeric, 2) as avg_f,
           round(avg(rating_clarity)::numeric, 2) as avg_c,
           round(avg(rating_expertise)::numeric, 2) as avg_e,
           round(avg(rating_support)::numeric, 2) as avg_s,
           count(*)::int as n,
           case when count(*) filter (where would_take_again is not null) > 0
                then round(100.0 * count(*) filter (where would_take_again)
                      / count(*) filter (where would_take_again is not null))::int
                else null end as wta
    from public.reviews
    where professor_id = target and status = 'approved'
  )
  update public.professors p set
    review_count = s.n,
    avg_overall = s.avg_o,
    avg_difficulty = s.avg_d,
    avg_fairness = s.avg_f,
    avg_clarity = s.avg_c,
    avg_expertise = s.avg_e,
    avg_support = s.avg_s,
    would_take_again_pct = s.wta
  from s where p.id = target;
  return coalesce(new, old);
end;
$$;

-- one-time backfill of the two new cached avgs
update public.professors p set
  avg_expertise = s.avg_e,
  avg_support = s.avg_s
from (
  select professor_id,
         round(avg(rating_expertise)::numeric, 2) as avg_e,
         round(avg(rating_support)::numeric, 2) as avg_s
  from public.reviews where status = 'approved' group by professor_id
) s
where p.id = s.professor_id;

-- ===== 8. grants for new cols =====
grant select (rating_expertise) on public.reviews to anon, authenticated;
grant select (rating_support) on public.reviews to anon, authenticated;
grant insert (rating_expertise) on public.reviews to authenticated;
grant insert (rating_support) on public.reviews to authenticated;

-- ===== 9. keep public_reviews view in sync =====
drop view if exists public.public_reviews;
create view public.public_reviews
with (security_invoker = false) as
select
  r.id, r.professor_id, r.course_id, r.is_anonymous,
  r.rating_overall, r.rating_difficulty, r.rating_fairness, r.rating_clarity,
  r.rating_expertise, r.rating_support,
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
