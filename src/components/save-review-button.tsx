"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSaveAction } from "@/app/actions/social";

export function SaveReviewButton({
  reviewId,
  initialSaved,
  loggedIn,
  dict,
}: {
  reviewId: string;
  initialSaved: boolean;
  loggedIn: boolean;
  dict: { save: string; saved: string; loginRequired: string };
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!loggedIn) {
      window.alert(dict.loginRequired);
      return;
    }
    startTransition(async () => {
      const res = await toggleSaveAction(reviewId);
      if (res.ok && typeof res.saved === "boolean") {
        setSaved(res.saved);
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      title={saved ? dict.saved : dict.save}
      className={`text-xs transition-colors disabled:opacity-60 ${
        saved
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-zinc-400 hover:text-indigo-500 dark:text-zinc-500"
      }`}
    >
      {saved ? "📑" : "🔖"} {saved ? dict.saved : dict.save}
    </button>
  );
}
