"use client";

import { useActionState } from "react";
import { updateProfessorProfileAction } from "@/app/actions/professor";

type ProfileDict = {
  academicTitle: string;
  bioLabel: string;
  researchInterests: string;
  submitCreate: string;
  saved: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600";

export function EditProfileForm({
  dict,
  initial,
}: {
  dict: ProfileDict;
  initial: {
    academic_title: string | null;
    bio: string | null;
    research_interests: string[];
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateProfessorProfileAction,
    { status: "idle" } as
      | { status: "idle" }
      | { status: "error"; error: string }
      | { status: "saved" }
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict.academicTitle}
        </label>
        <input
          type="text"
          name="academic_title"
          defaultValue={initial.academic_title ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{dict.bioLabel}</label>
        <textarea
          name="bio"
          rows={4}
          defaultValue={initial.bio ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict.researchInterests}
        </label>
        <input
          type="text"
          name="research_interests"
          defaultValue={initial.research_interests.join(", ")}
          className={inputClass}
        />
      </div>

      {state.status === "saved" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {dict.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {dict.submitCreate}
      </button>
    </form>
  );
}
