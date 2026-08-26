"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReviewAction } from "@/app/actions/review";
import { REVIEW_TAG_KEYS } from "@/lib/tags";

type ReviewFormState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; published: boolean };

type ReviewDict = {
  title: string;
  overallRating: string;
  difficultyRating: string;
  fairnessRating: string;
  wouldTakeAgain: string;
  anonymous: string;
  anonymousHint: string;
  contentLabel: string;
  contentPlaceholder: string;
  submit: string;
  submitting: string;
  loginRequired: string;
  goToLogin: string;
  notVerified: string;
  goVerify: string;
  successPending: string;
  successPublished: string;
  alreadyReviewed: string;
  ratingRequired: string;
  contentTooShort: string;
  professorBlocked: string;
  tagsLabel: string;
  tagLabels: Record<string, string>;
  clarityRating: string;
  attendanceLabel: string;
  textbookLabel: string;
  creditLabel: string;
  yes: string;
  no: string;
  unsure: string;
  optionalNote: string;
};

function StarInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={name}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={`text-2xl leading-none transition-transform hover:scale-110 ${
            i <= value ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  professorSlug,
  dict,
  authState,
}: {
  professorSlug: string;
  dict: ReviewDict;
  authState: "logged_out" | "unverified" | "ok";
}) {
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction,
    { status: "idle" }
  );
  const [overall, setOverall] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [fairness, setFairness] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  if (authState === "logged_out")
    return (
      <div className="rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-700">
        <p className="text-zinc-600 dark:text-zinc-300">{dict.loginRequired}</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {dict.goToLogin}
        </Link>
      </div>
    );

  if (authState === "unverified")
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950/40">
        <p className="text-amber-900 dark:text-amber-200">{dict.notVerified}</p>
        <Link
          href="/verify"
          className="mt-3 inline-block rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          {dict.goVerify}
        </Link>
      </div>
    );

  if (state.status === "success")
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          state.published
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        }`}
      >
        {state.published ? dict.successPublished : dict.successPending}
      </div>
    );

  const errorMessage =
    state.status === "error"
      ? state.error === "already_reviewed"
        ? dict.alreadyReviewed
        : state.error === "content_short"
          ? dict.contentTooShort
          : state.error === "professor_blocked"
            ? dict.professorBlocked
            : dict.ratingRequired
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="professorSlug" value={professorSlug} />
      <input type="hidden" name="rating_overall" value={overall || ""} />
      <input type="hidden" name="rating_difficulty" value={difficulty || ""} />
      <input type="hidden" name="rating_fairness" value={fairness || ""} />
      <input type="hidden" name="rating_clarity" value={clarity || ""} />

      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {dict.title}
      </h3>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-6 sm:gap-y-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{dict.overallRating}</span>
        <StarInput name="overall" value={overall} onChange={setOverall} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{dict.clarityRating}</span>
        <StarInput name="clarity" value={clarity} onChange={setClarity} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{dict.difficultyRating}</span>
        <StarInput name="difficulty" value={difficulty} onChange={setDifficulty} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{dict.fairnessRating}</span>
        <StarInput name="fairness" value={fairness} onChange={setFairness} />
      </div>

      <fieldset className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <legend className="px-1 text-xs uppercase tracking-wide text-zinc-400">
          {dict.optionalNote}
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["attendance_required", dict.attendanceLabel],
              ["textbook_used", dict.textbookLabel],
              ["for_credit", dict.creditLabel],
            ] as const
          ).map(([name, label]) => (
            <div key={name}>
              <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input type="radio" name={name} value="yes" /> {dict.yes}
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name={name} value="no" /> {dict.no}
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name={name} value="" defaultChecked /> {dict.unsure}
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="w-full text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {dict.wouldTakeAgain}
        </legend>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="radio" name="would_take_again" value="yes" defaultChecked /> Yes / Có
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="radio" name="would_take_again" value="no" /> No / Không
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="radio" name="would_take_again" value="unsure" defaultChecked /> N/A
        </label>
      </fieldset>

      <div>
        <p className="label">{dict.tagsLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_TAG_KEYS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-zinc-300 text-zinc-600 hover:border-indigo-400 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              {dict.tagLabels[tag] ?? tag}
            </button>
          ))}
        </div>
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
      </div>

      <div>
        <textarea
          name="content"
          rows={5}
          required
          minLength={30}
          placeholder={dict.contentPlaceholder}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-transparent p-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="is_anonymous" className="h-4 w-4" />
          {dict.anonymous}
        </label>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{dict.anonymousHint}</p>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
