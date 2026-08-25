"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewFormState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success" };

export async function submitReviewAction(
  _prev: unknown,
  formData: FormData
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const professorSlug = String(formData.get("professorSlug") ?? "");

  if (!user) return { status: "error", error: "login_required" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.verification === "none")
    return { status: "error", error: "not_verified" };

  // D10: professors cannot review other professors
  if (profile.role === "professor")
    return { status: "error", error: "professor_blocked" };

  const ratingOverall = Number(formData.get("rating_overall"));
  const ratingDifficulty = Number(formData.get("rating_difficulty"));
  const ratingFairness = Number(formData.get("rating_fairness"));
  const wouldTakeAgainRaw = formData.get("would_take_again");
  const isAnonymous = formData.get("is_anonymous") === "on";
  const content = String(formData.get("content") ?? "").trim();

  if (
    ![ratingOverall, ratingDifficulty, ratingFairness].every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 5
    )
  )
    return { status: "error", error: "rating_required" };

  if (content.length < 30) return { status: "error", error: "content_short" };

  const { data: professor } = await supabase
    .from("professors")
    .select("id")
    .eq("slug", professorSlug)
    .single();

  if (!professor) return { status: "error", error: "generic" };

  // Per D7: publish immediately once moderation filter passes.
  // MVP: keyword pre-filter — suspicious content goes to pending queue.
  const suspiciousPatterns = [
    /https?:\/\//i,
    /\b\d{9,}\b/,
    /(địt|lồn|cặc|buồi|đú|ngu|idiots?\b|stupid\b|fuck)/i,
  ];
  const needsModeration = suspiciousPatterns.some((p) => p.test(content));

  const { error } = await supabase.from("reviews").insert({
    professor_id: professor.id,
    author_id: user.id,
    is_anonymous: isAnonymous,
    rating_overall: ratingOverall,
    rating_difficulty: ratingDifficulty,
    rating_fairness: ratingFairness,
    would_take_again:
      wouldTakeAgainRaw === null ? null : wouldTakeAgainRaw === "yes",
    content,
    tags: [],
    status: needsModeration ? "pending" : "approved",
  });

  if (error) {
    if (error.code === "23505") return { status: "error", error: "already_reviewed" };
    return { status: "error", error: "generic" };
  }

  revalidatePath(`/professors/${professorSlug}`);
  return { status: "success" };
}
