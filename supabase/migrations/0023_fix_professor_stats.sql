-- Migration 0023: fix professor stats never updating + moderation bypass.
--
-- Root cause (verified 0/197 professors had stats): trg_prof_owner_guard
-- (BEFORE UPDATE on professors) reverted stat columns on EVERY update from a
-- non-staff session, including the system recompute fired by
-- refresh_professor_stats (auth.uid() is the student there, so is_staff()
-- is false). Fix: skip the guard when fired from a trigger cascade
-- (pg_trigger_depth() > 1); direct updates are still guarded.
-- Also drops trg_review_status which force-set every insert to 'approved',
-- bypassing the pending-moderation queue (the app sets status explicitly).
-- Finally backfills stats for all professors with approved reviews.

-- ===== 1. drop force-approve trigger (moderation bypass) =====
drop trigger if exists trg_review_status on public.reviews;
drop function if exists public.enforce_review_status();

-- ===== 2. guard skips trigger-cascade updates (system recompute) =====
create or replace function public.guard_professor_owner_update()
returns trigger
language plpgsql
as $$
begin
  -- Fired from another trigger (e.g. stats recompute after review change):
  -- let the system write through.
  if pg_trigger_depth() > 1 then
    return new;
  end if;
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

-- ===== 3. backfill stats for all professors with approved reviews =====
-- (guard would revert a plain UPDATE from a non-JWT session, so bypass it
-- for this one-time backfill, then re-enable.)
alter table public.professors disable trigger trg_prof_owner_guard;

update public.professors p set
  review_count = s.n,
  avg_overall = s.avg_o,
  avg_difficulty = s.avg_d,
  avg_fairness = s.avg_f,
  avg_clarity = s.avg_c,
  avg_expertise = s.avg_e,
  avg_support = s.avg_s,
  would_take_again_pct = s.wta
from (
  select professor_id,
         count(*)::int as n,
         round(avg(rating_overall)::numeric, 2) as avg_o,
         round(avg(rating_difficulty)::numeric, 2) as avg_d,
         round(avg(rating_fairness)::numeric, 2) as avg_f,
         round(avg(rating_clarity)::numeric, 2) as avg_c,
         round(avg(rating_expertise)::numeric, 2) as avg_e,
         round(avg(rating_support)::numeric, 2) as avg_s,
         case when count(*) filter (where would_take_again is not null) > 0
              then round(100.0 * count(*) filter (where would_take_again)
                    / count(*) filter (where would_take_again is not null))::int
              else null end as wta
  from public.reviews
  where status = 'approved'
  group by professor_id
) s
where p.id = s.professor_id;

alter table public.professors enable trigger trg_prof_owner_guard;
