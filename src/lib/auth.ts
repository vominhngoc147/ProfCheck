import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  display_name: string;
  role: string;
  verification: string;
};

// Cached per request: Header + page share ONE auth resolution instead of
// 3-4 duplicate getUser() roundtrips to Supabase Auth per navigation.
export const getCurrentUser = cache(
  async (): Promise<{ id: string; email?: string } | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email };
  }
);

export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id ?? null;
});

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, role, verification")
      .eq("id", userId)
      .maybeSingle();
    return profile ?? null;
  }
);

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
  avatar_url: string | null;
  source_status: string;
  school_id: string;
  faculty_id: string | null;
  research_interests: string[];
  research_fields: string[];
  degrees: string[];
  titles: string[];
  awards: { year?: string; title: string; org?: string }[];
  allow_forum_reup: boolean;
};

export async function getOwnedProfessor(): Promise<
  { profile: CurrentProfile; professor: OwnedProfessor | null }
> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: professor } = await supabase
    .from("professors")
    .select(
      "id, slug, full_name, academic_title, bio, avatar_url, source_status, school_id, faculty_id, research_interests, research_fields, degrees, titles, awards, allow_forum_reup"
    )
    .eq("owner_profile_id", profile.id)
    .maybeSingle();
  return { profile, professor };
}
