-- Migration 0013: TRUE anonymity hardening (D7)
-- Base `reviews` table keeps row-level visibility, but identifier columns
-- (author_id, moderated_by) are revoked for app roles. Only the DB owner /
-- direct SQL sessions (migration runner, admins via SQL) can see them.
-- All UI reads of identity go through `public_reviews` view which nulls
-- anonymous authors anyway.

revoke select, update on table public.reviews from authenticated;
revoke select on table public.reviews from anon;

grant select (
  id, professor_id, course_id, is_anonymous,
  rating_overall, rating_difficulty, rating_fairness, rating_clarity,
  attendance_required, textbook_used, for_credit,
  would_take_again, tags, content, advisor_type,
  status, created_at, updated_at
) on public.reviews to authenticated;

grant select (
  id, professor_id, course_id, is_anonymous,
  rating_overall, rating_difficulty, rating_fairness, rating_clarity,
  attendance_required, textbook_used, for_credit,
  would_take_again, tags, content, advisor_type,
  status, created_at, updated_at
) on public.reviews to anon;

-- INSERT needs column-level insert grants (server action inserts these):
grant insert (
  professor_id, course_id, author_id, is_anonymous,
  rating_overall, rating_difficulty, rating_fairness, rating_clarity,
  attendance_required, textbook_used, for_credit,
  would_take_again, tags, content, advisor_type, status
) on public.reviews to authenticated;

-- UPDATE used by moderation actions and self-edit window:
grant update (
  content, tags, status, updated_at, moderated_by
) on public.reviews to authenticated;
