import { getOwnedProfessor } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { EditProfileForm } from "@/components/prof-profile-form";

export default async function ProfProfilePage() {
  const { professor } = await getOwnedProfessor();
  const dict = await getDictionary();
  if (!professor) return null;

  return (
    <div className="max-w-xl rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700">
      {professor.source_status !== "claimed" ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {dict.profDash.notVerifiedNote}
        </p>
      ) : (
        <EditProfileForm
          dict={{
            academicTitle: dict.onboarding.academicTitle,
            bioLabel: dict.onboarding.bioLabel,
            researchInterests: dict.onboarding.researchInterests,
            submitCreate: dict.common.save,
            saved: dict.profDash.saved,
            avatarLabel: dict.profDash.avatarLabel,
            avatarHint: dict.profDash.avatarHint,
            degreesLabel: dict.profDash.degreesLabel,
            degreesPlaceholder: dict.profDash.degreesPlaceholder,
            titlesLabel: dict.profDash.titlesLabel,
            titlesPlaceholder: dict.profDash.titlesPlaceholder,
            awardsLabel: dict.profDash.awardsLabel,
            awardsHint: dict.profDash.awardsHint,
            awardsPlaceholder: dict.profDash.awardsPlaceholder,
            fieldsLabel: dict.profDash.fieldsLabel,
            fieldsPlaceholder: dict.profDash.fieldsPlaceholder,
            allowReupLabel: dict.profDash.allowReupLabel,
            allowReupHint: dict.profDash.allowReupHint,
          }}
          initial={{
            academic_title: professor.academic_title,
            bio: professor.bio,
            avatar_url: professor.avatar_url,
            research_interests: professor.research_interests ?? [],
            research_fields: professor.research_fields ?? [],
            degrees: professor.degrees ?? [],
            titles: professor.titles ?? [],
            awards: professor.awards ?? [],
            allow_forum_reup: professor.allow_forum_reup ?? true,
          }}
        />
      )}
    </div>
  );
}
