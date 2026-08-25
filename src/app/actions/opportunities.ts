"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplyState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "applied" };

export async function applyOpportunityAction(
  _prev: unknown,
  formData: FormData
): Promise<ApplyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "login_required" };

  const opportunityId = String(formData.get("opportunity_id") ?? "");
  const message = String(formData.get("message") ?? "").trim() || null;
  if (!opportunityId) return { status: "error", error: "generic" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification")
    .eq("id", user.id)
    .single();
  if (!profile || profile.verification === "none")
    return { status: "error", error: "unverified" };

  const { error } = await supabase.from("applications").insert({
    opportunity_id: opportunityId,
    student_id: user.id,
    message,
  });

  if (error) {
    if (error.code === "23505") return { status: "error", error: "dup" };
    return { status: "error", error: "generic" };
  }

  revalidatePath("/opportunities");
  return { status: "applied" };
}
