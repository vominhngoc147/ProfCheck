import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n";
import { ForumPostForm } from "@/components/forum-post-form";

export const metadata = { title: "P-forum" };

export default async function ForumNewPage({
  searchParams,
}: PageProps<"/forum/new">) {
  const params = await searchParams;
  const reupId = typeof params.reup === "string" ? params.reup : undefined;
  const dict = await getDictionary();
  const supabase = await createClient();

  const [{ data: topics }, { data: tags }, { data: auth }] = await Promise.all([
    supabase.from("forum_topics").select("id, slug, title").order("title"),
    supabase.from("forum_tags").select("id, name_vi").order("name_vi"),
    supabase.auth.getUser(),
  ]);

  let verification: string | null = null;
  if (auth?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification")
      .eq("id", auth.user.id)
      .single();
    verification = profile?.verification ?? null;
  }
  const canPost = !!auth?.user && verification !== null && verification !== "none";

  let reup: {
    reviewId: string;
    blocked: boolean;
    professorName: string | null;
    professorSlug: string | null;
    rating: number | null;
    excerpt: string;
  } | null = null;
  if (reupId) {
    const { data: review } = await supabase
      .from("public_reviews")
      .select(
        "id, rating_overall, content, allow_forum_reup, professor_id, status"
      )
      .eq("id", reupId)
      .single();
    if (!review) {
      reup = {
        reviewId: reupId,
        blocked: true,
        professorName: null,
        professorSlug: null,
        rating: null,
        excerpt: "",
      };
    } else {
      const { data: prof } = await supabase
        .from("professors")
        .select("full_name, slug, allow_forum_reup")
        .eq("id", review.professor_id)
        .single();
      const blocked =
        review.status !== "approved" ||
        !review.allow_forum_reup ||
        !prof?.allow_forum_reup;
      reup = {
        reviewId: reupId,
        blocked,
        professorName: prof?.full_name ?? null,
        professorSlug: prof?.slug ?? null,
        rating: review.rating_overall,
        excerpt: String(review.content).slice(0, 300),
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/forum"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {dict.forum.backToForum}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {reup && !reup.blocked ? dict.forum.reupTitle : dict.forum.newPost}
      </h1>
      {!canPost ? (
        <p className="card mt-4 p-6 text-center text-sm text-zinc-600 dark:text-zinc-300">
          {dict.forum.needVerified}
        </p>
      ) : (
        <div className="card mt-4 p-6">
          <ForumPostForm
            topics={(topics ?? []).map((t) => ({
              id: t.id,
              slug: t.slug,
              title: t.title,
            }))}
            tags={(tags ?? []).map((t) => ({ id: t.id, name_vi: t.name_vi }))}
            reup={reup}
            dict={{
              createTabPost: dict.forum.createTabPost,
              createTabTopic: dict.forum.createTabTopic,
              createTabTag: dict.forum.createTabTag,
              topicLabel: dict.forum.topicLabel,
              noTopic: dict.forum.noTopic,
              postTitleLabel: dict.forum.postTitleLabel,
              postTitlePlaceholder: dict.forum.postTitlePlaceholder,
              contentLabel: dict.forum.contentLabel,
              contentPlaceholder: dict.forum.contentPlaceholder,
              tagsLabel: dict.forum.tagsLabel,
              tagNameVi: dict.forum.tagNameVi,
              tagNameEn: dict.forum.tagNameEn,
              topicTitleLabel: dict.forum.topicTitleLabel,
              topicTitlePlaceholder: dict.forum.topicTitlePlaceholder,
              topicDescLabel: dict.forum.topicDescLabel,
              topicDescPlaceholder: dict.forum.topicDescPlaceholder,
              submitPost: dict.forum.submitPost,
              submitTopic: dict.forum.submitTopic,
              submitTag: dict.forum.submitTag,
              createdPost: dict.forum.createdPost,
              createdTopic: dict.forum.createdTopic,
              createdTag: dict.forum.createdTag,
              reupFrom: dict.forum.reupFrom,
              reupHint: dict.forum.reupHint,
              reupBlocked: dict.forum.reupBlocked,
              duplicate: dict.forum.duplicate,
              invalidInput: dict.forum.invalidInput,
              viewPost: dict.forum.viewPost,
            }}
          />
        </div>
      )}
    </div>
  );
}
