-- Migration 0021: P-forum schema (dot 5) — tags, topics, posts, nested comments, votes.

-- ===== 1. forum_tags =====
create table public.forum_tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_vi text not null,
  name_en text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.forum_tags enable row level security;
create policy "ftags_select_all" on public.forum_tags for select using (true);
create policy "ftags_insert_verified" on public.forum_tags
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );
create policy "ftags_admin" on public.forum_tags
  for all using (public.is_staff()) with check (public.is_staff());

-- ===== 2. forum_topics =====
create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.forum_topics enable row level security;
create policy "ftopics_select_all" on public.forum_topics for select using (true);
create policy "ftopics_insert_verified" on public.forum_topics
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );
create policy "ftopics_update_own_or_admin" on public.forum_topics
  for update using (created_by = auth.uid() or public.is_staff())
  with check (created_by = auth.uid() or public.is_staff());
create policy "ftopics_delete_admin" on public.forum_topics
  for delete using (public.is_staff());

-- ===== 3. forum_topic_tags (join) =====
create table public.forum_topic_tags (
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  tag_id uuid not null references public.forum_tags(id) on delete cascade,
  primary key (topic_id, tag_id)
);

alter table public.forum_topic_tags enable row level security;
create policy "ftt_select_all" on public.forum_topic_tags for select using (true);
create policy "ftt_insert_verified" on public.forum_topic_tags
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );
create policy "ftt_delete_admin" on public.forum_topic_tags
  for delete using (public.is_staff());

-- ===== 4. forum_posts =====
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete set null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  content text not null check (char_length(content) between 1 and 10000),
  image_urls text[] not null default '{}',
  reup_review_id uuid references public.reviews(id) on delete set null,
  reup_snapshot jsonb not null default '{}',
  vote_score int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_forum_posts_topic on public.forum_posts(topic_id);
create index if not exists idx_forum_posts_created on public.forum_posts(created_at desc);
create index if not exists idx_forum_posts_score on public.forum_posts(vote_score desc);

alter table public.forum_posts enable row level security;
create policy "fposts_select_all" on public.forum_posts for select using (true);
create policy "fposts_insert_verified" on public.forum_posts
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );
create policy "fposts_update_own_or_admin" on public.forum_posts
  for update using (author_id = auth.uid() or public.is_staff())
  with check (author_id = auth.uid() or public.is_staff());
create policy "fposts_delete_own_or_admin" on public.forum_posts
  for delete using (author_id = auth.uid() or public.is_staff());

-- ===== 5. forum_comments (nested via parent_id) =====
create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  parent_id uuid references public.forum_comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  vote_score int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_comments_post on public.forum_comments(post_id);

alter table public.forum_comments enable row level security;
create policy "fcomments_select_all" on public.forum_comments for select using (true);
create policy "fcomments_insert_verified" on public.forum_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );
create policy "fcomments_update_own" on public.forum_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "fcomments_delete_own_or_admin" on public.forum_comments
  for delete using (author_id = auth.uid() or public.is_staff());

-- ===== 6. forum_votes (1 user 1 vote / target) =====
create table public.forum_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

alter table public.forum_votes enable row level security;
create policy "fvotes_select_own_or_staff" on public.forum_votes
  for select using (user_id = auth.uid() or public.is_staff());
create policy "fvotes_insert_verified" on public.forum_votes
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification <> 'none'
    )
  );
create policy "fvotes_update_own" on public.forum_votes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "fvotes_delete_own" on public.forum_votes
  for delete using (user_id = auth.uid());

-- ===== 7. triggers: vote_score + comment_count caches =====
create or replace function public.refresh_forum_vote_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tid uuid;
  ttype text;
begin
  if tg_op = 'DELETE' then tid := old.target_id; ttype := old.target_type;
  else tid := new.target_id; ttype := new.target_type; end if;

  if ttype = 'post' then
    update public.forum_posts p set
      vote_score = coalesce((select sum(value)::int from public.forum_votes
        where target_type = 'post' and target_id = tid), 0)
    where p.id = tid;
  elsif ttype = 'comment' then
    update public.forum_comments c set
      vote_score = coalesce((select sum(value)::int from public.forum_votes
        where target_type = 'comment' and target_id = tid), 0)
    where c.id = tid;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_forum_vote_score on public.forum_votes;
create trigger trg_forum_vote_score
after insert or update or delete on public.forum_votes
for each row execute function public.refresh_forum_vote_score();

create or replace function public.refresh_forum_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if tg_op = 'DELETE' then pid := old.post_id; else pid := new.post_id; end if;
  update public.forum_posts p set
    comment_count = (select count(*)::int from public.forum_comments where post_id = pid)
  where p.id = pid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_forum_comment_count on public.forum_comments;
create trigger trg_forum_comment_count
after insert or delete on public.forum_comments
for each row execute function public.refresh_forum_comment_count();
