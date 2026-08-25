"use client";

import { useActionState } from "react";
import Link from "next/link";
import { applyOpportunityAction } from "@/app/actions/opportunities";

type ApplyDict = {
  apply: string;
  applied: string;
  applyDup: string;
  applyLogin: string;
  applyUnverified: string;
  messagePlaceholder: string;
};

type AuthState = "logged_out" | "unverified" | "ok";

export function ApplyButton({
  opportunityId,
  dict,
  authState,
}: {
  opportunityId: string;
  dict: ApplyDict;
  authState: AuthState;
}) {
  const [state, formAction, pending] = useActionState(
    applyOpportunityAction,
    { status: "idle" } as
      | { status: "idle" }
      | { status: "error"; error: string }
      | { status: "applied" }
  );

  if (authState === "logged_out")
    return (
      <Link
        href="/login"
        className="inline-block rounded-full border border-indigo-300 px-4 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
      >
        {dict.applyLogin}
      </Link>
    );

  if (state.status === "applied")
    return (
      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
        ✓ {dict.applied}
      </span>
    );

  if (authState === "unverified")
    return (
      <Link href="/verify" className="text-xs text-amber-700 hover:underline dark:text-amber-300">
        {dict.applyUnverified}
      </Link>
    );

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <textarea
        name="message"
        rows={2}
        placeholder={dict.messagePlaceholder}
        className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-600"
      />
      {state.status === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {state.error === "dup"
            ? dict.applyDup
            : state.error === "unverified"
              ? dict.applyUnverified
              : state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {dict.apply}
      </button>
    </form>
  );
}
