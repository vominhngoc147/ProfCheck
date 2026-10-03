import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/i18n";
import { ForumVote } from "@/components/forum-vote";

export async function generateMetadata({ params }: PageProps<"/forum/[topic]">) {
  const { topic } = await params;
  return { title: `P-forum · ${topic}` };
}

export default async function ForumTopicPage({
  params,
}: PageProps<"/forum/[topic]">) {
  const { topic: slug } = await params;
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("forum_topics")
    .select("id, slug, title, description, created_at")
    .eq("slug", slug)
    .single();
  if (!topic) notFound();

  const [{ data: tags }, { data: posts }, { data: auth }] = await Promise.all([
    supabase
      .from("forum_topic_tags")
      .select("forum_tags(name_vi)")
      .eq("topic_id", topic.id),
    supabase
      .from("public_forum_posts")
      .select(
        "id, author_name, title, reup_review_id, vote_score, comment_count, created_at"
      )
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.auth.getUser(),
  ]);

  const postIds = (posts ?? []).map((p) => p.id as string);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/forum"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {dict.forum.backToForum}
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{topic.title}</h1>
          {topic.description && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {topic.description}
            </p>
          )}
          {(tags ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(tags ?? []).map((t, i) => {
                const tag = Array.isArray(t.forum_tags) ? t.forum_tags[0] : t.forum_tags;
                return (
                  tag && (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      #{(tag as { name_vi: string }).name_vi}
                    </span>
                  )
                );
              })}
            </div>
          )}
        </div>
        <Link href="/forum/new" className="btn-primary">
          + {dict.forum.newPost}
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(posts ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.forum.emptyPosts}</p>
        )}
        {(posts ?? []).map((p) => (
          <article key={p.id as string} className="card flex gap-3 p-4">
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
              <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  {dict.forum.byAuthor} {p.author_name as string}
                </span>
                <span>· {new Date(p.created_at as string).toLocaleDateString(locale)}</span>
                <span>· 💬 {p.comment_count as number}</span>
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
