import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { StarRating } from "@/components/star-rating";
import { SaveReviewButton } from "@/components/save-review-button";

export const metadata = { title: "Bài đã lưu" };

export default async function SavedPage() {
  const dict = await getDictionary();
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: saved } = await supabase
    .from("saved_reviews")
    .select(
      "created_at, reviews(id, rating_overall, purpose, course_code, content, created_at, professors(full_name, slug))"
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const purposeName = (p: string) =>
    p === "hoc_tap"
      ? dict.search.purposeHocTap
      : p === "nckh"
        ? dict.search.purposeNckh
        : p === "kltn"
          ? dict.search.purposeKltn
          : dict.search.purposeTtgk;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dict.me.savedTitle}</h1>
        <Link
          href="/me"
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {dict.me.title}
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {(saved ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {dict.me.savedEmpty}
          </p>
        )}
        {(saved ?? []).map((s) => {
          const r = Array.isArray(s.reviews) ? s.reviews[0] : s.reviews;
          if (!r) return null;
          const prof = Array.isArray(r.professors) ? r.professors[0] : r.professors;
          return (
            <article
              key={r.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating value={r.rating_overall} />
                <SaveReviewButton
                  reviewId={r.id}
                  initialSaved
                  loggedIn
                  dict={dict.saved}
                />
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                {r.content}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                  {purposeName(r.purpose)}
                </span>
                {r.course_code && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                    📘 {r.course_code}
                  </span>
                )}
                {prof && (
                  <Link
                    href={`/professors/${prof.slug}`}
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {prof.full_name} ↗
                  </Link>
                )}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
