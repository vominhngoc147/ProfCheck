"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  submitClaimAction,
  createProfessorProfileAction,
} from "@/app/actions/professor";

type OnboardingDict = {
  searchTitle: string;
  searchPlaceholder: string;
  searchButton: string;
  notFound: string;
  createInstead: string;
  claimButton: string;
  evidenceLabel: string;
  fullName: string;
  academicTitle: string;
  facultyLabel: string;
  bioLabel: string;
  researchInterests: string;
  submitCreate: string;
  resultApproved: string;
  resultPending: string;
  alreadyOwned: string;
  nameRequired: string;
};

const inputClass =
  "h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600";

function claimMessage(claim: string, dict: OnboardingDict): string {
  if (claim === "approved") return dict.resultApproved;
  if (claim === "already_owned") return dict.alreadyOwned;
  return dict.resultPending;
}

export function ClaimResult({
  claim,
  dict,
}: {
  claim: string;
  dict: OnboardingDict;
}) {
  return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
      <p>{claimMessage(claim, dict)}</p>
      <Link
        href="/prof"
        className="mt-3 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        → /prof
      </Link>
    </div>
  );
}

export function ClaimButton({
  professorId,
  dict,
}: {
  professorId: string;
  dict: OnboardingDict;
}) {
  const [result, setResult] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      const res = await submitClaimAction(professorId, evidence);
      if (res.status === "claim_ok" || res.status === "error") {
        setResult(res.status === "claim_ok" ? res.claim : "error");
      }
    });
  }

  if (result)
    return (
      <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        {result === "error" ? dict.notFound : claimMessage(result, dict)}
      </div>
    );

  return (
    <div className="mt-3">
      {showEvidence && (
        <input
          type="text"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder={dict.evidenceLabel}
          className={`${inputClass} mb-2`}
        />
      )}
      <button
        type="button"
        onClick={() => (showEvidence ? handleClaim() : setShowEvidence(true))}
        disabled={pending}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {dict.claimButton}
      </button>
    </div>
  );
}

export function CreateForm({
  dict,
  faculties,
}: {
  dict: OnboardingDict;
  faculties: { id: string; name_vi: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createProfessorProfileAction,
    { status: "idle" } as
      | { status: "idle" }
      | { status: "error"; error: string }
      | { status: "created"; claim: string; slug: string }
  );

  if (state.status === "created")
    return <ClaimResult claim={state.claim} dict={dict} />;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="school_slug" value="ftu" />
      <input type="text" name="full_name" required placeholder={dict.fullName} className={inputClass} />
      <input type="text" name="academic_title" placeholder={dict.academicTitle} className={inputClass} />
      <select name="faculty_id" className={inputClass} defaultValue="">
        <option value="">—</option>
        {faculties.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name_vi}
          </option>
        ))}
      </select>
      <textarea
        name="bio"
        rows={3}
        placeholder={dict.bioLabel}
        className={`${inputClass} h-auto py-2`}
      />
      <input
        type="text"
        name="research_interests"
        placeholder={dict.researchInterests}
        className={inputClass}
      />
      {state.status === "error" && state.error === "name_required" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {dict.nameRequired}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 self-start rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {dict.submitCreate}
      </button>
    </form>
  );
}
