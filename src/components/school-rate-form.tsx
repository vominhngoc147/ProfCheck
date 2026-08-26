"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { rateSchoolAction } from "@/app/actions/school";

type Dict = {
  quality: string;
  social: string;
  facilities: string;
  submitRating: string;
  ratingSaved: string;
  needVerifiedToRate: string;
  loginToRate: string;
};

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
  const [quality, setQuality] = useState(0);
  const [social, setSocial] = useState(0);
  const [facilities, setFacilities] = useState(0);
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
      const res = await rateSchoolAction(schoolId, quality, social, facilities);
      if (res.ok) setSaved(true);
    });
  }

  const ready = quality > 0 && social > 0 && facilities > 0;

  return (
    <form
      action={submit}
      className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px]"
    >
      {(
        [
          ["quality", quality, setQuality],
          ["social", social, setSocial],
          ["facilities", facilities, setFacilities],
        ] as const
      ).map(([key, val, set]) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {dict[key]}
          </span>
          <StarRow value={val} onChange={set} />
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
