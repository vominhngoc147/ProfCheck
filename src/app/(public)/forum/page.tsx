import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/i18n";
import { ForumVote } from "@/components/forum-vote";

export const metadata = { title: "P-forum" };

function hotScore(voteScore: number, createdAt: string): number {
  const hours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3600000);
  return voteScore / Math.pow(hours + 2, 1.5);
}

export default async function ForumPage({
  searchParams,
}: PageProps<"/forum">) {
  const params = await searchParams;
  const rawSort = typeof params.sort === "string" ? params.sort : "hot";
  const sort = rawSort === "new" || rawSort === "top" ? rawSort : "hot";
  const topicSlug = typeof params.topic === "string" ? params.topic : undefined;
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: topics }, { data: auth }] = await Promise.all([
    supabase.from("forum_topics").select("id, slug, title").order("title"),
    supabase.auth.getUser(),
  ]);

  let topicId: string | null = null;
  if (topicSlug) {
    const t = (topics ?? []).find((x) => x.slug === topicSlug);
    if (t) topicId = t.id;
  }

  let postQuery = supabase
    .from("public_forum_posts")
    .select(
      "id, topic_id, topic_slug, topic_title, author_id, author_name, title, reup_review_id, vote_score, comment_count, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (topicId) postQuery = postQuery.eq("topic_id", topicId);
  const { data: posts } = await postQuery;

  const ranked = (posts ?? []).map((p) => ({
    ...p,
    hot: hotScore(p.vote_score as number, p.created_at as string),
  }));
  if (sort === "hot") ranked.sort((a, b) => b.hot - a.hot);
  else if (sort === "top") ranked.sort((a, b) => (b.vote_score as number) - (a.vote_score as number));

  const postIds = ranked.map((p) => p.id as string);
  const voteMap = new Map<string, number>();
  if (auth?.user && postIds.length > 0) {
    const { data: votes } = await supabase
      .from("forum_votes")
      .select("target_id, value")
      .eq("user_id", auth.user.id)
      .eq("target_type", "post")
      .in("target_id", postIds);
    for (const v of votes ?? []) voteMap.set(v.target_id as string, v.value as number);
  }

  const sortHref = (s: string) => {
    const sp = new URLSearchParams();
    if (s !== "hot") sp.set("sort", s);
    if (topicSlug) sp.set("topic", topicSlug);
    const q = sp.toString();
    return q ? `/forum?${q}` : "/forum";
  };
  const topicHref = (slug?: string) => {
    const sp = new URLSearchParams();
    if (sort !== "hot") sp.set("sort", sort);
    if (slug) sp.set("topic", slug);
    const q = sp.toString();
    return q ? `/forum?${q}` : "/forum";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{dict.forum.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {dict.forum.subtitle}
          </p>
        </div>
        <Link href="/forum/new" className="btn-primary">
          + {dict.forum.newPost}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(
          [
            ["hot", dict.forum.sortHot],
            ["new", dict.forum.sortNew],
            ["top", dict.forum.sortTop],
          ] as const
        ).map(([s, label]) => (
          <Link
            key={s}
            href={sortHref(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${sort === s ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Link
          href={topicHref(undefined)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${!topicSlug ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
        >
          {dict.forum.allTopics}
        </Link>
        {(topics ?? []).map((t) => (
          <Link
            key={t.id}
            href={topicHref(t.slug)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${topicSlug === t.slug ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
          >
            {t.title}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {ranked.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.forum.emptyPosts}</p>
        )}
        {ranked.map((p) => (
          <article
            key={p.id as string}
            className="card flex gap-3 p-4"
          >
            <ForumVote
              targetType="post"
              targetId={p.id as string}
              postId={p.id as string}
              score={p.vote_score as number}
              myVote={voteMap.get(p.id as string) ?? null}
              loggedIn={!!auth?.user}
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/forum/post/${p.id}`}
                className="font-semibold hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
              >
                {p.title as string}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  {dict.forum.byAuthor} {p.author_name as string}
                </span>
                <span>· {new Date(p.created_at as string).toLocaleDateString(locale)}</span>
                <span>· 💬 {p.comment_count as number}</span>
                {(p.topic_title as string | null) && (
                  <Link
                    href={topicHref(p.topic_slug as string)}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium hover:underline dark:bg-zinc-800"
                  >
                    {p.topic_title as string}
                  </Link>
                )}
                {(p.reup_review_id as string | null) && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                    {dict.forum.reupFrom}
                  </span>
                )}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
