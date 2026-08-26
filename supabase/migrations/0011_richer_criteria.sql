-- Migration 0011: richer rating criteria (professor + school), RMP-style flags

-- ===== Professor reviews: thêm tiêu chí dạy dễ hiểu + flags kiểu RMP =====
alter table public.reviews
  add column if not exists rating_clarity smallint
    check (rating_clarity between 1 and 5);

alter table public.reviews
  add column if not exists attendance_required boolean,
  add column if not exists textbook_used boolean,
  add column if not exists for_credit boolean;

-- ===== Cached stats: thêm avg_clarity (thay thế hàm trigger của 0001) =====
alter table public.professors
  add column if not exists avg_clarity numeric(3,2);

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
    would_take_again_pct = s.wta
  from s where p.id = target;
  return coalesce(new, old);
end;
$$;

-- ===== School ratings: mở rộng 6 tiêu chí =====
alter table public.school_ratings
  add column if not exists rating_reputation smallint
    check (rating_reputation between 1 and 5),
  add column if not exists rating_location smallint
    check (rating_location between 1 and 5),
  add column if not exists rating_support smallint
    check (rating_support between 1 and 5);
