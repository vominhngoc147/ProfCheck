"use client";

import { useActionState } from "react";
import { submitStudentCardAction } from "@/app/actions/verify";

type Dict = {
  uploadTitle: string;
  uploadHint: string;
  chooseFile: string;
  submitUpload: string;
  uploaded: string;
  uploadFailed: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600";

export function CardUploadForm({ dict }: { dict: Dict }) {
  const [state, formAction, pending] = useActionState(
    submitStudentCardAction,
    { status: "idle" } as
      | { status: "idle" }
      | { status: "error"; error: string }
      | { status: "uploaded" }
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <h2 className="font-semibold">{dict.uploadTitle}</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{dict.uploadHint}</p>
      <input type="file" name="card" accept="image/jpeg,image/png,image/webp" required className={inputClass} />
      {state.status === "uploaded" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {dict.uploaded}
        </p>
      )}
      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {dict.uploadFailed}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {dict.submitUpload}
      </button>
    </form>
  );
}
