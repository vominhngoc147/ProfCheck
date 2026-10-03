"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REVIEW_TAG_KEYS } from "@/lib/tags";

export type ReviewFormState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; published: boolean };

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
  const ratingFairnessRaw = formData.get("rating_fairness");
  const ratingFairness =
    ratingFairnessRaw === null || ratingFairnessRaw === ""
      ? null
      : Number(ratingFairnessRaw);
  const ratingClarityRaw = formData.get("rating_clarity");
  const ratingClarity =
    ratingClarityRaw === null || ratingClarityRaw === ""
      ? null
      : Number(ratingClarityRaw);
  const ratingExpertiseRaw = formData.get("rating_expertise");
  const ratingExpertise =
    ratingExpertiseRaw === null || ratingExpertiseRaw === ""
      ? null
      : Number(ratingExpertiseRaw);
  const ratingSupportRaw = formData.get("rating_support");
  const ratingSupport =
    ratingSupportRaw === null || ratingSupportRaw === ""
      ? null
      : Number(ratingSupportRaw);
  const wouldTakeAgainRaw = formData.get("would_take_again");
  const isAnonymous = formData.get("is_anonymous") === "on";
  const allowForumReup = formData.get("allow_forum_reup") !== "off";
  const content = String(formData.get("content") ?? "").trim();
  const courseCodeRaw = String(formData.get("course_code") ?? "").trim();
  const courseCode = courseCodeRaw ? courseCodeRaw.slice(0, 30) : null;

  const purposeRaw = String(formData.get("purpose") ?? "hoc_tap");
  const purpose = ["hoc_tap", "nckh", "kltn", "ttgk"].includes(purposeRaw)
    ? purposeRaw
    : "hoc_tap";
  const programRaw = String(formData.get("program") ?? "").trim();
  const program = ["clc", "cttt", "dhnnqt", "chinh_quy", "khac"].includes(
    programRaw
  )
    ? programRaw
    : null;

  // D13: half-star scale 0.5-5.0
  const isHalf = (n: number | null) =>
    n !== null &&
    Number.isFinite(n) &&
    n >= 0.5 &&
    n <= 5 &&
    Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;

  // D15: required criteria per purpose
  const required: (number | null)[] =
    purpose === "hoc_tap"
      ? [ratingOverall, ratingClarity, ratingDifficulty, ratingFairness, ratingExpertise]
      : purpose === "nckh"
        ? [ratingOverall, ratingSupport, ratingDifficulty, ratingExpertise]
        : [ratingOverall, ratingSupport, ratingDifficulty, ratingFairness, ratingExpertise];

  if (!required.every(isHalf))
    return { status: "error", error: "rating_required" };

  if (content.length < 30) return { status: "error", error: "content_short" };

  function triBool(name: string): boolean | null {
    const v = formData.get(name);
    return v === null || v === "" ? null : v === "yes";
  }

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
    allow_forum_reup: allowForumReup,
    purpose,
    program: program,
    course_code: courseCode,
    rating_overall: ratingOverall,
    rating_difficulty: ratingDifficulty,
    rating_fairness: ratingFairness,
    rating_clarity: ratingClarity,
    rating_expertise: ratingExpertise,
    rating_support: ratingSupport,
    attendance_required: triBool("attendance_required"),
    textbook_used: triBool("textbook_used"),
    for_credit: triBool("for_credit"),
    would_take_again:
      wouldTakeAgainRaw === null ? null : wouldTakeAgainRaw === "yes",
    content,
    tags: formData
      .getAll("tags")
      .map(String)
      .filter((t): t is (typeof REVIEW_TAG_KEYS)[number] =>
        (REVIEW_TAG_KEYS as readonly string[]).includes(t)
      ),
    status: needsModeration ? "pending" : "approved",
  });

  if (error) {
    if (error.code === "23505") return { status: "error", error: "already_reviewed" };
    return { status: "error", error: "generic" };
  }

  revalidatePath(`/professors/${professorSlug}`);
  return { status: "success", published: !needsModeration };
}

export type SimpleResult = { ok: boolean; error?: string };

export async function reportReviewAction(
  reviewId: string,
  reason: string,
  details: string
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };
  if (!reason) return { ok: false, error: "generic" };

  const { error } = await supabase.from("reports").insert({
    review_id: reviewId,
    reporter_id: user.id,
    reason,
    details: details.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "dup" };
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function updateMyReviewAction(
  reviewId: string,
  content: string
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  const trimmed = content.trim();
  if (trimmed.length < 30) return { ok: false, error: "content_short" };

  const { data: review } = await supabase
    .from("reviews")
    .select("created_at")
    .eq("id", reviewId)
    .single();
  if (!review) return { ok: false, error: "not_owner" };
  if (Date.now() - new Date(review.created_at).getTime() > EDIT_WINDOW_MS)
    return { ok: false, error: "edit_window_over" };

  // RLS (rev_update_own) ensures the row belongs to the caller
  const { data: updated, error } = await supabase
    .from("reviews")
    .update({ content: trimmed, status: "pending", updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("id");
  if (error || !updated || updated.length === 0)
    return { ok: false, error: "not_owner" };

  revalidatePath("/me");
  revalidatePath("/prof");
  return { ok: true };
}

export async function deleteMyReviewAction(reviewId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };

  // RLS (rev_delete_own_or_admin) restricts deletion to own rows
  const { data: deleted, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .select("id");
  if (error) return { ok: false, error: "generic" };
  if (!deleted || deleted.length === 0) return { ok: false, error: "not_owner" };

  revalidatePath("/me");
  return { ok: true };
}
