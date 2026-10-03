"use client";

import { useActionState } from "react";
import { updateProfessorProfileAction } from "@/app/actions/professor";

type ProfileDict = {
  academicTitle: string;
  bioLabel: string;
  researchInterests: string;
  submitCreate: string;
  saved: string;
  avatarLabel: string;
  avatarHint: string;
  degreesLabel: string;
  degreesPlaceholder: string;
  titlesLabel: string;
  titlesPlaceholder: string;
  awardsLabel: string;
  awardsHint: string;
  awardsPlaceholder: string;
  fieldsLabel: string;
  fieldsPlaceholder: string;
  allowReupLabel: string;
  allowReupHint: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600";

export type EditProfileInitial = {
  academic_title: string | null;
  bio: string | null;
  avatar_url: string | null;
  research_interests: string[];
  research_fields: string[];
  degrees: string[];
  titles: string[];
  awards: { year?: string; title: string; org?: string }[];
  allow_forum_reup: boolean;
};

function awardsToText(
  awards: EditProfileInitial["awards"]
): string {
  return (awards ?? [])
    .map((a) => [a.year, a.title, a.org].filter(Boolean).join(" | "))
    .join("\n");
}

export function EditProfileForm({
  dict,
  initial,
}: {
  dict: ProfileDict;
  initial: EditProfileInitial;
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
      {initial.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={initial.avatar_url}
          alt=""
          className="h-20 w-20 rounded-full object-cover"
        />
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict.avatarLabel}
        </label>
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {dict.avatarHint}
        </p>
      </div>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {dict.degreesLabel}
          </label>
          <input
            type="text"
            name="degrees"
            defaultValue={(initial.degrees ?? []).join(", ")}
            placeholder={dict.degreesPlaceholder}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {dict.titlesLabel}
          </label>
          <input
            type="text"
            name="titles"
            defaultValue={(initial.titles ?? []).join(", ")}
            placeholder={dict.titlesPlaceholder}
            className={inputClass}
          />
        </div>
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
          {dict.fieldsLabel}
        </label>
        <input
          type="text"
          name="research_fields"
          defaultValue={(initial.research_fields ?? []).join(", ")}
          placeholder={dict.fieldsPlaceholder}
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
      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict.awardsLabel}
        </label>
        <textarea
          name="awards"
          rows={3}
          defaultValue={awardsToText(initial.awards)}
          placeholder={dict.awardsPlaceholder}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {dict.awardsHint}
        </p>
      </div>
      <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="allow_forum_reup"
            defaultChecked={initial.allow_forum_reup}
            value="on"
            className="h-4 w-4"
          />
          {dict.allowReupLabel}
        </label>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {dict.allowReupHint}
        </p>
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
