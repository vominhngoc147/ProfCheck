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
          }}
          initial={professor}
        />
      )}
    </div>
  );
}
