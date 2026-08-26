"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SchoolRatingResult = { ok: boolean; error?: string };

function valid(n: number) {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function rateSchoolAction(
  schoolId: string,
  quality: number,
  social: number,
  facilities: number
): Promise<SchoolRatingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "login_required" };
  if (![quality, social, facilities].every(valid))
    return { ok: false, error: "invalid" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification")
    .eq("id", user.id)
    .single();
  if (!profile || profile.verification === "none")
    return { ok: false, error: "unverified" };

  const { error } = await supabase.from("school_ratings").upsert(
    {
      school_id: schoolId,
      user_id: user.id,
      rating_quality: quality,
      rating_social: social,
      rating_facilities: facilities,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,user_id" }
  );
  if (error) return { ok: false, error: "generic" };

  revalidatePath("/");
  return { ok: true };
}
