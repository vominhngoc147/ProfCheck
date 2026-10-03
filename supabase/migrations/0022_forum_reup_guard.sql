-- Migration 0022: forum reup guard (dot 5, D20)
-- A post may reference a review ONLY when the review is approved
-- AND both allow flags are true (review-level + professor-level).

create or replace function public.guard_forum_reup()
returns trigger language plpgsql as $$
declare
  v_status text;
  v_review_allow boolean;
  v_prof_allow boolean;
begin
  if new.reup_review_id is null then return new; end if;

  select r.status, r.allow_forum_reup, p.allow_forum_reup
    into v_status, v_review_allow, v_prof_allow
  from public.reviews r
  join public.professors p on p.id = r.professor_id
  where r.id = new.reup_review_id;

  if not found then
    raise exception 'reup_review_not_found';
  end if;
  if v_status <> 'approved' then
    raise exception 'reup_review_not_approved';
  end if;
  if coalesce(v_review_allow, false) = false
     or coalesce(v_prof_allow, false) = false then
    raise exception 'reup_not_allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_forum_reup_guard on public.forum_posts;
create trigger trg_forum_reup_guard
before insert or update of reup_review_id on public.forum_posts
for each row execute function public.guard_forum_reup();

-- ===== public views (author names for forum display) =====
create view public.public_forum_posts
with (security_invoker = false) as
select
  p.id, p.topic_id, p.author_id, pr.display_name as author_name,
  p.title, p.content, p.image_urls, p.reup_review_id, p.reup_snapshot,
  p.vote_score, p.comment_count, p.created_at, p.updated_at,
  t.slug as topic_slug, t.title as topic_title
from public.forum_posts p
join public.profiles pr on pr.id = p.author_id
left join public.forum_topics t on t.id = p.topic_id;

grant select on public.public_forum_posts to anon, authenticated;
revoke insert, update, delete, truncate on public.public_forum_posts from anon;
revoke insert, update, delete, truncate on public.public_forum_posts from authenticated;

create view public.public_forum_comments
with (security_invoker = false) as
select
  c.id, c.post_id, c.parent_id, c.author_id, pr.display_name as author_name,
  c.content, c.vote_score, c.created_at
from public.forum_comments c
join public.profiles pr on pr.id = c.author_id;

grant select on public.public_forum_comments to anon, authenticated;
revoke insert, update, delete, truncate on public.public_forum_comments from anon;
revoke insert, update, delete, truncate on public.public_forum_comments from authenticated;
