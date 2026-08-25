"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnedProfessor } from "@/lib/auth";

export type ProfessorActionResult =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "claim_ok"; claim: string }
  | { status: "created"; claim: string; slug: string }
  | { status: "saved" }
  | { status: "opp_created" };

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "giao-vien";
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  fullName: string
): Promise<string> {
  const base = slugify(fullName);
  const { data } = await supabase
    .from("professors")
    .select("slug")
    .eq("school_id", schoolId)
    .like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function submitClaimAction(
  professorId: string,
  evidenceUrl: string
): Promise<ProfessorActionResult> {
  const supabase = await createClient();
  const { data: claim, error } = await supabase.rpc(
    "submit_professor_claim",
    { p_professor_id: professorId, p_evidence_url: evidenceUrl || null }
  );
  if (error) return { status: "error", error: "generic" };

  const { data: prof } = await supabase
    .from("professors")
    .select("slug")
    .eq("id", professorId)
    .single();
  if (prof) revalidatePath(`/professors/${prof.slug}`);
  revalidatePath("/prof");
  return { status: "claim_ok", claim: String(claim) };
}

export async function createProfessorProfileAction(
  _prev: unknown,
  formData: FormData
): Promise<ProfessorActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "login_required" };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const academicTitle = String(formData.get("academic_title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const facultyId = String(formData.get("faculty_id") ?? "") || null;
  const researchRaw = String(formData.get("research_interests") ?? "");
  const researchInterests = researchRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const schoolSlug = String(formData.get("school_slug") ?? "ftu");

  if (!fullName || fullName.length < 3)
    return { status: "error", error: "name_required" };

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("slug", schoolSlug)
    .single();
  if (!school) return { status: "error", error: "generic" };

  const slug = await uniqueSlug(supabase, school.id, fullName);

  const { data: created, error: insertError } = await supabase
    .from("professors")
    .insert({
      school_id: school.id,
      faculty_id: facultyId,
      slug,
      full_name: fullName,
      academic_title: academicTitle || null,
      bio: bio || null,
      research_interests: researchInterests,
      source_status: "user_created",
    })
    .select("id")
    .single();

  if (insertError || !created)
    return { status: "error", error: "generic" };

  const { data: claim } = await supabase.rpc("submit_professor_claim", {
    p_professor_id: created.id,
    p_evidence_url: null,
  });

  revalidatePath("/prof");
  return {
    status: "created",
    claim: String(claim),
    slug,
  };
}

export async function updateProfessorProfileAction(
  _prev: unknown,
  formData: FormData
): Promise<ProfessorActionResult> {
  const { professor } = await getOwnedProfessor();
  if (!professor) return { status: "error", error: "not_owner" };
  if (professor.source_status !== "claimed")
    return { status: "error", error: "not_verified" };

  const supabase = await createClient();
  const academicTitle = String(formData.get("academic_title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const researchRaw = String(formData.get("research_interests") ?? "");

  const { error } = await supabase
    .from("professors")
    .update({
      academic_title: academicTitle || null,
      bio: bio || null,
      research_interests: researchRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })
    .eq("id", professor.id);

  if (error) return { status: "error", error: "generic" };

  revalidatePath(`/professors/${professor.slug}`);
  revalidatePath("/prof/profile");
  return { status: "saved" };
}

export async function createOpportunityAction(
  _prev: unknown,
  formData: FormData
): Promise<ProfessorActionResult> {
  const { professor } = await getOwnedProfessor();
  if (!professor) return { status: "error", error: "not_owner" };

  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "nckh");
  const description = String(formData.get("description") ?? "").trim();
  const slotsTotal = Number(formData.get("slots_total") ?? 1);
  const deadline = String(formData.get("deadline") ?? "") || null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title || !Number.isInteger(slotsTotal) || slotsTotal < 1)
    return { status: "error", error: "invalid" };

  const { error } = await supabase.from("opportunities").insert({
    professor_id: professor.id,
    type,
    title,
    description,
    tags,
    slots_total: slotsTotal,
    slots_left: slotsTotal,
    deadline,
  });

  if (error) return { status: "error", error: "generic" };

  revalidatePath("/prof/slots");
  return { status: "opp_created" };
}

export async function setOpportunityStatusAction(
  opportunityId: string,
  status: "open" | "closed"
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("opportunities")
    .update({ status })
    .eq("id", opportunityId);
  revalidatePath("/prof/slots");
}

export async function deleteOpportunityAction(
  opportunityId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("opportunities").delete().eq("id", opportunityId);
  revalidatePath("/prof/slots");
}
