import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary, getLocale } from "@/i18n";
import { StarRating } from "@/components/star-rating";
import { ForumVote } from "@/components/forum-vote";
import {
  ForumComments,
  type ForumCommentItem,
} from "@/components/forum-comments";
import { DeleteForumPostButton } from "@/components/forum-delete-button";

export async function generateMetadata() {
  return { title: "P-forum" };
}

export default async function ForumPostPage({
  params,
}: PageProps<"/forum/post/[id]">) {
  const { id } = await params;
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("public_forum_posts")
    .select(
      "id, topic_id, topic_slug, topic_title, author_id, author_name, title, content, reup_review_id, reup_snapshot, vote_score, comment_count, created_at"
    )
    .eq("id", id)
    .single();
  if (!post) notFound();

  const [{ data: comments }, profile] = await Promise.all([
    supabase
      .from("public_forum_comments")
      .select("id, parent_id, author_id, author_name, content, vote_score, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .limit(500),
    getCurrentProfile(),
  ]);

  const currentUserId = profile?.id ?? null;
  const verification = profile?.verification ?? null;
  const isStaff = profile?.role === "admin" || profile?.role === "moderator";
  const canComment = !!currentUserId && verification !== "none";

  const commentIds = (comments ?? []).map((c) => c.id as string);
  const voteMap = new Map<string, number>();
  if (currentUserId && commentIds.length > 0) {
    const { data: votes } = await supabase
      .from("forum_votes")
      .select("target_type, target_id, value")
      .eq("user_id", currentUserId)
      .in("target_id", [...commentIds, id]);
    for (const v of votes ?? [])
      voteMap.set(`${v.target_type as string}:${v.target_id as string}`, v.value as number);
  }

  const items: ForumCommentItem[] = (comments ?? []).map((c) => ({
    id: c.id as string,
    parent_id: c.parent_id as string | null,
    content: c.content as string,
    author_name: c.author_name as string | null,
    author_id: c.author_id as string,
    created_at: c.created_at as string,
    vote_score: c.vote_score as number,
    myVote: voteMap.get(`comment:${c.id as string}`) ?? null,
    mine: currentUserId !== null && c.author_id === currentUserId,
  }));

  const snap = (post.reup_snapshot ?? {}) as {
    professor_name?: string;
    professor_slug?: string;
    rating_overall?: number;
    purpose?: string;
    course_code?: string;
    content_excerpt?: string;
  };
  const canDelete =
    currentUserId !== null && (post.author_id === currentUserId || isStaff);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/forum"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {dict.forum.backToForum}
      </Link>

      <article className="card mt-3 flex gap-3 p-5">
        <ForumVote
          targetType="post"
          targetId={post.id as string}
          postId={post.id as string}
          score={post.vote_score as number}
          myVote={voteMap.get(`post:${post.id as string}`) ?? null}
          loggedIn={!!currentUserId}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{post.title as string}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {dict.forum.byAuthor} {post.author_name as string}
            </span>
            <span>· {new Date(post.created_at as string).toLocaleString(locale)}</span>
            {(post.topic_title as string | null) && (
              <Link
                href={`/forum/${post.topic_slug as string}`}
                className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium hover:underline dark:bg-zinc-800"
              >
                {post.topic_title as string}
              </Link>
            )}
            {canDelete && (
              <DeleteForumPostButton
                postId={post.id as string}
                label={dict.forum.deletePost}
                confirmLabel={dict.forum.confirmDelete}
              />
            )}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {post.content as string}
          </p>

          {(post.reup_review_id as string | null) && (
            <div className="mt-4 rounded-xl border border-violet-300 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/40">
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">
                {dict.forum.reupFrom}
                {snap.professor_name && snap.professor_slug ? (
                  <Link href={`/professors/${snap.professor_slug}`} className="hover:underline">
                    {" "}
                    {snap.professor_name}
                  </Link>
                ) : (
                  snap.professor_name && <> {snap.professor_name}</>
                )}
              </p>
              {typeof snap.rating_overall === "number" && (
                <div className="mt-1 flex items-center gap-1.5">
                  <StarRating value={snap.rating_overall} />
                  <span className="text-xs text-zinc-500">
                    {snap.rating_overall}/5
                    {snap.course_code ? ` · 📘 ${snap.course_code}` : ""}
                  </span>
                </div>
              )}
              {snap.content_excerpt && (
                <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                  “{snap.content_excerpt}”
                </p>
              )}
            </div>
          )}
        </div>
      </article>

      <section className="card mt-4 p-5">
        <ForumComments
          postId={post.id as string}
          comments={items}
          canComment={canComment}
          loggedIn={!!currentUserId}
          currentUserId={currentUserId}
          dict={{
            commentsTitle: dict.forum.commentsTitle,
            commentPlaceholder: dict.forum.commentPlaceholder,
            commentReply: dict.forum.commentReply,
            commentDelete: dict.forum.commentDelete,
            confirmDelete: dict.forum.confirmDelete,
            tooDeep: dict.forum.tooDeep,
            needVerified: dict.forum.needVerified,
            submitPost: dict.forum.submitPost,
          }}
        />
      </section>
    </div>
  );
}
