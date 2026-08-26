"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReviewAction } from "@/app/actions/review";
import { REVIEW_TAG_KEYS } from "@/lib/tags";

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

type WizardDict = {
  step1: string;
  step2: string;
  step3: string;
  next: string;
  back: string;
  courseCode: string;
  courseCodePlaceholder: string;
};

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i}/5`}
          onClick={() => onChange(i)}
          className={`text-4xl leading-none transition-transform hover:scale-115 ${
            i <= value ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function TriBool({ name, dict }: { name: string; dict: ReviewDict }) {
  return (
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
  );
}

export function ReviewForm({
  professorSlug,
  dict,
  wdict,
  authState,
}: {
  professorSlug: string;
  dict: ReviewDict;
  wdict: WizardDict;
  authState: "logged_out" | "unverified" | "ok";
}) {
  const [state, formAction, pending] = useActionState(
    submitReviewAction,
    { status: "idle" } as
      | { status: "idle" }
      | { status: "error"; error: string }
      | { status: "success"; published: boolean }
  );

  const [step, setStep] = useState(1);
  const [overall, setOverall] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [fairness, setFairness] = useState(0);
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
        <Link href="/login" className="btn-primary mt-3 inline-flex">
          {dict.goToLogin}
        </Link>
      </div>
    );

  if (authState === "unverified")
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950/40">
        <p className="text-amber-900 dark:text-amber-200">{dict.notVerified}</p>
        <Link href="/verify" className="btn-primary mt-3 inline-flex !bg-amber-600 hover:!bg-amber-500">
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

  const step1Ok =
    overall > 0 && clarity > 0 && difficulty > 0 && fairness > 0;

  const errorMessage =
    state.status === "error"
      ? state.error === "already_reviewed"
        ? dict.alreadyReviewed
        : state.error === "content_short"
          ? dict.contentTooShort
          : dict.ratingRequired
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="professorSlug" value={professorSlug} />
      <input type="hidden" name="rating_overall" value={overall || ""} />
      <input type="hidden" name="rating_clarity" value={clarity || ""} />
      <input type="hidden" name="rating_difficulty" value={difficulty || ""} />
      <input type="hidden" name="rating_fairness" value={fairness || ""} />

      {/* progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step >= s
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
              }`}
            >
              {s}
            </span>
            <span
              className={`text-xs font-medium ${
                step >= s ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"
              }`}
            >
              {[wdict.step1, wdict.step2, wdict.step3][s - 1]}
            </span>
            {s < 3 && (
              <span
                className={`h-0.5 flex-1 rounded ${step > s ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-700"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: ratings */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          {(
            [
              [dict.overallRating, overall, setOverall],
              [dict.clarityRating, clarity, setClarity],
              [dict.difficultyRating, difficulty, setDifficulty],
              [dict.fairnessRating, fairness, setFairness],
            ] as const
          ).map(([label, val, set]) => (
            <div
              key={label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {label}
              </span>
              <StarInput value={val} onChange={set} />
            </div>
          ))}
          {!step1Ok && step === 1 && (
            <button type="button" disabled className="btn-primary self-end opacity-40">
              {wdict.next}
            </button>
          )}
          {step1Ok && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary self-end"
            >
              {wdict.next} →
            </button>
          )}
        </div>
      )}

      {/* STEP 2: course + flags + tags */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="label">{wdict.courseCode}</p>
            <input
              type="text"
              name="course_code"
              placeholder={wdict.courseCodePlaceholder}
              className="input"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {dict.wouldTakeAgain}
            </p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="would_take_again" value="yes" /> {dict.yes}
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="would_take_again" value="no" /> {dict.no}
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="would_take_again" value="" defaultChecked />{" "}
                {dict.unsure}
              </label>
            </div>
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
                  <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {label}
                  </p>
                  <TriBool name={name} dict={dict} />
                </div>
              ))}
            </div>
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

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              ← {wdict.back}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-primary"
            >
              {wdict.next} →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: comment + anonymity */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="label">{dict.contentLabel}</p>
            <textarea
              name="content"
              rows={6}
              required
              minLength={30}
              placeholder={dict.contentPlaceholder}
              className="input resize-y"
            />
          </div>

          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name="is_anonymous" className="h-4 w-4" />
              🕶️ {dict.anonymous}
            </label>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {dict.anonymousHint}
            </p>
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              ← {wdict.back}
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? dict.submitting : `★ ${dict.submit}`}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
