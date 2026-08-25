"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["moderator", "admin"].includes(profile.role)) redirect("/");
  return supabase;
}

export async function moderateReviewAction(
  reviewId: string,
  decision: "approved" | "rejected"
): Promise<void> {
  const supabase = await requireStaff();
  await supabase
    .from("reviews")
    .update({ status: decision })
    .eq("id", reviewId);
  revalidatePath("/admin");
}

export async function decideClaimAction(
  claimId: string,
  professorId: string,
  claimantId: string,
  decision: "approved" | "rejected"
): Promise<void> {
  const supabase = await requireStaff();
  const { error } = await supabase
    .from("professor_claims")
    .update({ status: decision })
    .eq("id", claimId);
  if (error) {
    revalidatePath("/admin");
    return;
  }

  if (decision === "approved") {
    await supabase
      .from("professors")
      .update({ source_status: "claimed", owner_profile_id: claimantId })
      .eq("id", professorId);
    await supabase
      .from("profiles")
      .update({ role: "professor" })
      .eq("id", claimantId)
      .eq("role", "student");
  }
  revalidatePath("/admin");
}

export async function decideCardAction(
  userId: string,
  decision: "approve" | "reject"
): Promise<void> {
  const supabase = await requireStaff();
  if (decision === "approve") {
    await supabase
      .from("profiles")
      .update({ verification: "card_verified" })
      .eq("id", userId)
      .eq("verification", "card_pending");
  } else {
    await supabase
      .from("profiles")
      .update({ verification: "none", student_card_url: null })
      .eq("id", userId)
      .eq("verification", "card_pending");
  }
  revalidatePath("/admin");
}

export async function resolveReportAction(
  reportId: string,
  decision: "resolved" | "dismissed"
): Promise<void> {
  const supabase = await requireStaff();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("reports")
    .update({ status: decision, handled_by: user?.id ?? null })
    .eq("id", reportId);
  revalidatePath("/admin");
}
