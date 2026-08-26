-- Migration 0014: class/course code on reviews (RMP-style)

alter table public.reviews
  add column if not exists course_code text;

grant select (course_code) on public.reviews to authenticated;
grant select (course_code) on public.reviews to anon;
grant insert (course_code) on public.reviews to authenticated;

-- keep the public view in sync with new columns
create or replace view public.public_reviews
with (security_invoker = true) as
select
  r.id, r.professor_id, r.course_id, r.is_anonymous,
  r.rating_overall, r.rating_difficulty, r.rating_fairness, r.rating_clarity,
  r.attendance_required, r.textbook_used, r.for_credit,
  r.would_take_again, r.tags, r.content, r.advisor_type, r.course_code,
  r.status, r.created_at, r.updated_at,
  case when r.is_anonymous then null else r.author_id end as author_id,
  case when r.is_anonymous then null else pr.display_name end as author_name,
  case when r.is_anonymous then null else pr.avatar_url end as author_avatar
from public.reviews r
join public.profiles pr on pr.id = r.author_id;
