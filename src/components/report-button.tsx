"use client";

import { useState, useTransition } from "react";
import { reportReviewAction } from "@/app/actions/review";

type Dict = {
  button: string;
  title: string;
  reasonLabel: string;
  reasonSpam: string;
  reasonToxic: string;
  reasonFalse: string;
  reasonPii: string;
  detailsPlaceholder: string;
  submit: string;
  sent: string;
};

const REASONS = ["spam", "toxic", "false", "pii"] as const;

export function ReportButton({
  reviewId,
  dict,
}: {
  reviewId: string;
  dict: Dict;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const reason = String(formData.get("reason") ?? "");
    const details = String(formData.get("details") ?? "");
    startTransition(async () => {
      const res = await reportReviewAction(reviewId, reason, details);
      if (res.ok) setSent(true);
      else setError(res.error ?? "generic");
    });
  }

  if (sent)
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400">
        {dict.sent}
      </span>
    );

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-400 transition-colors hover:text-red-500 dark:text-zinc-500"
      >
        ⚑ {dict.button}
      </button>
    );

  return (
    <form
      action={handleSubmit}
      className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
    >
      <p className="mb-2 text-xs font-semibold">{dict.title}</p>
      {REASONS.map((r) => (
        <label key={r} className="flex items-center gap-1.5 py-0.5 text-xs">
          <input type="radio" name="reason" value={r} required />
          {dict[`reason${r.charAt(0).toUpperCase() + r.slice(1)}` as keyof Dict] as string}
        </label>
      ))}
      <textarea
        name="details"
        rows={2}
        placeholder={dict.detailsPlaceholder}
        className="input mt-2 !py-1.5 text-xs"
      />
      {error && <p className="mt-1 text-xs text-red-500">{dict.submit}</p>}
      <div className="mt-2 flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary !px-3 !py-1.5 !text-xs">
          {dict.submit}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary !px-3 !py-1.5 !text-xs">
          ✕
        </button>
      </div>
    </form>
  );
}
