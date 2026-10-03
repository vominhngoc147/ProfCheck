"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SimpleResult = { ok: boolean; error?: string };

export async function addCommentAction(
  reviewId: string,
  content: string,
  anonymous: boolean,
  professorSlug: string
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000)
    return { ok: false, error: "invalid" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification")
    .eq("id", user.id)
    .single();
  if (!profile || profile.verification === "none")
    return { ok: false, error: "not_verified" };

  const { error } = await supabase.from("review_comments").insert({
    review_id: reviewId,
    author_id: user.id,
    content: trimmed,
    is_anonymous: anonymous,
  });
  if (error) return { ok: false, error: "generic" };

  revalidatePath(`/professors/${professorSlug}`);
  return { ok: true };
}

export async function deleteCommentAction(
  commentId: string,
  professorSlug: string
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  // RLS (comments_delete_own_or_admin) restricts to own rows / staff
  const { data: deleted, error } = await supabase
    .from("review_comments")
    .delete()
    .eq("id", commentId)
    .select("id");
  if (error) return { ok: false, error: "generic" };
  if (!deleted || deleted.length === 0) return { ok: false, error: "not_owner" };

  revalidatePath(`/professors/${professorSlug}`);
  return { ok: true };
}

export async function toggleSaveAction(
  reviewId: string
): Promise<{ ok: boolean; saved?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  const { data: existing } = await supabase
    .from("saved_reviews")
    .select("review_id")
    .eq("user_id", user.id)
    .eq("review_id", reviewId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_reviews")
      .delete()
      .eq("user_id", user.id)
      .eq("review_id", reviewId);
    if (error) return { ok: false, error: "generic" };
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("saved_reviews")
    .insert({ user_id: user.id, review_id: reviewId });
  if (error) return { ok: false, error: "generic" };
  return { ok: true, saved: true };
}
