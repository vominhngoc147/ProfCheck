"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ForumResult =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "created"; id: string; slug?: string };

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "forum";
}

async function requireVerified(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification")
    .eq("id", user.id)
    .single();
  if (!profile || profile.verification === "none") return null;
  return user;
}

export async function createTagAction(
  _prev: unknown,
  formData: FormData
): Promise<ForumResult> {
  const supabase = await createClient();
  const user = await requireVerified(supabase);
  if (!user) return { status: "error", error: "not_verified" };

  const nameVi = String(formData.get("name_vi") ?? "").trim().slice(0, 60);
  const nameEn = String(formData.get("name_en") ?? "").trim().slice(0, 60) || null;
  if (nameVi.length < 2) return { status: "error", error: "invalid" };
  const slug = slugify(nameVi);

  const { data, error } = await supabase
    .from("forum_tags")
    .insert({ slug, name_vi: nameVi, name_en: nameEn, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { status: "error", error: "duplicate" };
    return { status: "error", error: "generic" };
  }
  revalidatePath("/forum");
  return { status: "created", id: data.id };
}

export async function createTopicAction(
  _prev: unknown,
  formData: FormData
): Promise<ForumResult> {
  const supabase = await createClient();
  const user = await requireVerified(supabase);
  if (!user) return { status: "error", error: "not_verified" };

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const tagIds = formData
    .getAll("tag_ids")
    .map(String)
    .filter(Boolean)
    .slice(0, 5);
  if (title.length < 3) return { status: "error", error: "invalid" };
  const slug = slugify(title);

  const { data, error } = await supabase
    .from("forum_topics")
    .insert({ slug, title, description, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { status: "error", error: "duplicate" };
    return { status: "error", error: "generic" };
  }
  if (tagIds.length > 0) {
    await supabase.from("forum_topic_tags").insert(
      tagIds.map((tag_id) => ({ topic_id: data.id, tag_id }))
    );
  }
  revalidatePath("/forum");
  return { status: "created", id: data.id, slug };
}

export async function createPostAction(
  _prev: unknown,
  formData: FormData
): Promise<ForumResult> {
  const supabase = await createClient();
  const user = await requireVerified(supabase);
  if (!user) return { status: "error", error: "not_verified" };

  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const content = String(formData.get("content") ?? "").trim().slice(0, 10000);
  const topicRaw = String(formData.get("topic_id") ?? "").trim();
  const topicId = topicRaw ? topicRaw : null;
  const reupRaw = String(formData.get("reup_review_id") ?? "").trim();
  const reupReviewId = reupRaw ? reupRaw : null;
  if (title.length < 3 || content.length < 1)
    return { status: "error", error: "invalid" };

  let snapshot: Record<string, unknown> = {};
  if (reupReviewId) {
    const { data: review } = await supabase
      .from("public_reviews")
      .select(
        "id, rating_overall, purpose, course_code, content, is_anonymous, author_name, created_at, professor_id"
      )
      .eq("id", reupReviewId)
      .single();
    if (!review) return { status: "error", error: "reup_not_found" };
    const { data: prof } = await supabase
      .from("professors")
      .select("full_name, slug")
      .eq("id", review.professor_id)
      .single();
    snapshot = {
      review_id: review.id,
      professor_name: prof?.full_name ?? null,
      professor_slug: prof?.slug ?? null,
      rating_overall: review.rating_overall,
      purpose: review.purpose,
      course_code: review.course_code,
      content_excerpt: String(review.content).slice(0, 300),
      author_name: review.is_anonymous ? null : review.author_name,
      created_at: review.created_at,
    };
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      topic_id: topicId,
      author_id: user.id,
      title,
      content,
      reup_review_id: reupReviewId,
      reup_snapshot: snapshot,
    })
    .select("id")
    .single();
  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("reup_not_allowed") || msg.includes("reup_review_not_approved"))
      return { status: "error", error: "reup_blocked" };
    return { status: "error", error: "generic" };
  }
  revalidatePath("/forum");
  return { status: "created", id: data.id };
}

export async function addForumCommentAction(
  postId: string,
  parentId: string | null,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await requireVerified(supabase);
  if (!user) return { ok: false, error: "not_verified" };

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 5000)
    return { ok: false, error: "invalid" };

  // Cap nesting depth at 3 levels.
  let depth = 0;
  let pid: string | null = parentId;
  while (pid) {
    const { data } = await supabase
      .from("forum_comments")
      .select("parent_id, post_id")
      .eq("id", pid)
      .single();
    if (!data || data.post_id !== postId) return { ok: false, error: "invalid" };
    depth++;
    if (depth >= 3) return { ok: false, error: "too_deep" };
    pid = data.parent_id;
  }

  const { error } = await supabase.from("forum_comments").insert({
    post_id: postId,
    parent_id: parentId,
    author_id: user.id,
    content: trimmed,
  });
  if (error) return { ok: false, error: "generic" };

  revalidatePath(`/forum/post/${postId}`);
  return { ok: true };
}

export async function toggleForumVoteAction(
  targetType: "post" | "comment",
  targetId: string,
  value: 1 | -1,
  postId: string
): Promise<{ ok: boolean; score?: number; myVote?: number | null; error?: string }> {
  const supabase = await createClient();
  const user = await requireVerified(supabase);
  if (!user) return { ok: false, error: "not_verified" };

  const { data: existing } = await supabase
    .from("forum_votes")
    .select("value")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  let myVote: number | null = value;
  if (existing && existing.value === value) {
    const { error } = await supabase
      .from("forum_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) return { ok: false, error: "generic" };
    myVote = null;
  } else {
    const { error } = await supabase.from("forum_votes").upsert(
      { user_id: user.id, target_type: targetType, target_id: targetId, value },
      { onConflict: "user_id,target_type,target_id" }
    );
    if (error) return { ok: false, error: "generic" };
  }

  const table = targetType === "post" ? "forum_posts" : "forum_comments";
  const { data: row } = await supabase
    .from(table)
    .select("vote_score")
    .eq("id", targetId)
    .single();

  revalidatePath(`/forum/post/${postId}`);
  revalidatePath("/forum");
  return { ok: true, score: (row?.vote_score as number) ?? 0, myVote };
}

export async function deleteForumPostAction(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  // RLS (fposts_delete_own_or_admin) restricts to own rows / staff.
  const { data: deleted, error } = await supabase
    .from("forum_posts")
    .delete()
    .eq("id", postId)
    .select("id");
  if (error) return { ok: false, error: "generic" };
  if (!deleted || deleted.length === 0) return { ok: false, error: "not_owner" };

  revalidatePath("/forum");
  return { ok: true };
}

export async function deleteForumCommentAction(
  commentId: string,
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  const { data: deleted, error } = await supabase
    .from("forum_comments")
    .delete()
    .eq("id", commentId)
    .select("id");
  if (error) return { ok: false, error: "generic" };
  if (!deleted || deleted.length === 0) return { ok: false, error: "not_owner" };

  revalidatePath(`/forum/post/${postId}`);
  return { ok: true };
}
