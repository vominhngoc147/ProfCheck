import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { StarRating } from "@/components/star-rating";
import { MyReviewControls } from "@/components/my-review-controls";

export const metadata = { title: "Đánh giá của tôi" };

const STATUS_LABEL = {
  approved: "statusApproved",
  pending: "statusPending",
  rejected: "statusRejected",
} as const;

const STATUS_CLASS = {
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  rejected:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
} as const;

export default async function MePage() {
  const dict = await getDictionary();
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, status, rating_overall, purpose, course_code, program, content, created_at, professors(full_name, slug)"
    )
    .eq("author_id", profile.id)
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
      <h1 className="text-2xl font-bold">{dict.me.title}</h1>
      <div className="mt-6 flex flex-col gap-3">
        {(reviews ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {dict.me.noReviews}
          </p>
        )}
        {(reviews ?? []).map((r) => {
          const prof = Array.isArray(r.professors)
            ? r.professors[0]
            : r.professors;
          return (
            <article
              key={r.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating_overall} />
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status as keyof typeof STATUS_CLASS]}`}
                  >
                    {
                      dict.me[
                        STATUS_LABEL[r.status as keyof typeof STATUS_LABEL]
                      ]
                    }
                  </span>
                </div>
                <time className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                {r.content}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                  {purposeName(r.purpose as string)}
                </span>
                {(r.course_code as string | null) && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                    📘 {r.course_code as string}
                  </span>
                )}
              </p>
              {prof && (
                <Link
                  href={`/professors/${(prof as { slug: string }).slug}`}
                  className="mt-2 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {(prof as { full_name: string }).full_name} ↗
                </Link>
              )}
              <MyReviewControls
                reviewId={r.id}
                content={r.content}
                createdAt={r.created_at}
                dict={dict.myReviewUi}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
