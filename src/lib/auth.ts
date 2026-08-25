import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  display_name: string;
  role: string;
  verification: string;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, verification")
    .eq("id", user.id)
    .maybeSingle();
  return profile ?? null;
}

export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(
  ...roles: string[]
): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}

export type OwnedProfessor = {
  id: string;
  slug: string;
  full_name: string;
  academic_title: string | null;
  bio: string | null;
  source_status: string;
  school_id: string;
  faculty_id: string | null;
  research_interests: string[];
};

export async function getOwnedProfessor(): Promise<
  { profile: CurrentProfile; professor: OwnedProfessor | null }
> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: professor } = await supabase
    .from("professors")
    .select(
      "id, slug, full_name, academic_title, bio, source_status, school_id, faculty_id, research_interests"
    )
    .eq("owner_profile_id", profile.id)
    .maybeSingle();
  return { profile, professor };
}
