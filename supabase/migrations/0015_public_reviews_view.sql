-- Migration 0015: public_reviews = owner-security + approved-only filter.
-- Final definition (identical to 0014's; kept as separate idempotent step
-- in case 0014 ran before this hardening existed).

drop view if exists public.public_reviews;
create view public.public_reviews
with (security_invoker = false) as
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
join public.profiles pr on pr.id = r.author_id
where r.status = 'approved';

grant select on public.public_reviews to anon, authenticated;
