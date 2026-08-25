import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOwnedProfessor } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { StarRating } from "@/components/star-rating";

export default async function ProfDashboardPage() {
  const { professor } = await getOwnedProfessor();
  const dict = await getDictionary();
  if (!professor) return null;

  const supabase = await createClient();
  const [{ data: fresh }, { data: reviews }] = await Promise.all([
    supabase
      .from("professors")
      .select("review_count, avg_overall, would_take_again_pct")
      .eq("id", professor.id)
      .single(),
    supabase
      .from("public_reviews")
      .select(
        "id, rating_overall, content, is_anonymous, author_name, created_at"
      )
      .eq("professor_id", professor.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {professor.academic_title ? `${professor.academic_title} ` : ""}
              {professor.full_name}
            </h2>
            {professor.source_status !== "claimed" && (
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {dict.professor.unverifiedLabel}
              </span>
            )}
          </div>
          <Link
            href={`/professors/${professor.slug}`}
            className="rounded-full border border-zinc-300 px-3.5 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {dict.profDash.viewPublic} ↗
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-2xl font-bold">{fresh?.avg_overall?.toFixed(1) ?? "–"}</p>
            <StarRating value={fresh?.avg_overall ?? 0} />
          </div>
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-2xl font-bold">{fresh?.review_count ?? 0}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dict.profDash.statsReviews}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-2xl font-bold">
              {fresh?.would_take_again_pct !== null &&
              fresh?.would_take_again_pct !== undefined
                ? `${fresh.would_take_again_pct}%`
                : "–"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dict.professor.wouldTakeAgain}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">{dict.profDash.recentReviews}</h3>
        <div className="flex flex-col gap-3">
          {(reviews ?? []).length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {dict.professor.noReviews}
            </p>
          )}
          {(reviews ?? []).map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating_overall} />
                  <span className="font-medium">
                    {r.is_anonymous
                      ? dict.professor.anonymousAuthor
                      : r.author_name}
                  </span>
                </div>
                <time className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </time>
              </div>
              <p className="mt-2 line-clamp-2 text-zinc-600 dark:text-zinc-400">
                {r.content}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
