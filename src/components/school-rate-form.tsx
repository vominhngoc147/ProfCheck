"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { rateSchoolAction } from "@/app/actions/school";

type Dict = {
  quality: string;
  social: string;
  facilities: string;
  reputation: string;
  location: string;
  support: string;
  submitRating: string;
  ratingSaved: string;
  needVerifiedToRate: string;
  loginToRate: string;
};

const CRITERIA = [
  ["quality", "quality"],
  ["social", "social"],
  ["facilities", "facilities"],
  ["reputation", "reputation"],
  ["location", "location"],
  ["support", "support"],
] as const;

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`${i}/5`}
          className={`text-xl leading-none transition-transform hover:scale-110 ${
            i <= value ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function SchoolRateForm({
  schoolId,
  dict,
  authState,
}: {
  schoolId: string;
  dict: Dict;
  authState: "logged_out" | "unverified" | "ok";
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (authState === "logged_out")
    return (
      <Link href="/login" className="btn-secondary !py-2 !text-xs">
        {dict.loginToRate}
      </Link>
    );

  if (saved)
    return (
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        ✓ {dict.ratingSaved}
      </p>
    );

  if (authState === "unverified")
    return (
      <Link href="/verify" className="text-xs text-amber-700 hover:underline dark:text-amber-300">
        {dict.needVerifiedToRate}
      </Link>
    );

  function submit() {
    startTransition(async () => {
      const res = await rateSchoolAction(
        schoolId,
        scores.quality ?? 0,
        scores.social ?? 0,
        scores.facilities ?? 0,
        scores.reputation ?? 0,
        scores.location ?? 0,
        scores.support ?? 0
      );
      if (res.ok) setSaved(true);
    });
  }

  const ready = CRITERIA.every(([key]) => (scores[key] ?? 0) > 0);

  return (
    <form
      action={submit}
      className="grid w-full gap-2 sm:min-w-[300px] sm:grid-cols-1"
    >
      {CRITERIA.map(([key, labelKey]) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {dict[labelKey]}
          </span>
          <StarRow
            value={scores[key] ?? 0}
            onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={pending || !ready}
        className="btn-primary mt-1 self-end !px-4 !py-2 !text-xs"
      >
        {dict.submitRating}
      </button>
    </form>
  );
}
