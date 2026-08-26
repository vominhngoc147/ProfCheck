import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";
import { StarRating, ScoreBadge } from "@/components/star-rating";
import { Avatar } from "@/components/professor-card";
import { ReviewForm } from "@/components/review-form";
import { ReportButton } from "@/components/report-button";
import type { Dictionary } from "@/i18n";

type PublicReview = {
  id: string;
  rating_overall: number;
  rating_difficulty: number;
  rating_fairness: number;
  would_take_again: boolean | null;
  is_anonymous: boolean;
  author_name: string | null;
  content: string;
  tags: string[] | null;
  created_at: string;
};

function difficultyLevel(value: number, dict: Dictionary): string {
  if (value <= 2.5) return dict.professor.easy;
  if (value <= 3.5) return dict.professor.moderate;
  return dict.professor.hard;
}

export default async function ProfessorPage({
  params,
}: PageProps<"/professors/[slug]">) {
  const { slug } = await params;
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: professor, error: profError } = await supabase
    .from("professors")
    .select(
      `id, slug, full_name, academic_title, bio, source_status,
       review_count, avg_overall, avg_difficulty, avg_fairness, would_take_again_pct,
       faculty_id`
    )
    .eq("slug", slug)
    .single();

  if (profError || !professor) notFound();

  const [{ data: reviews }, { data: replies }, { data: faculty }, { data: auth }] =
    await Promise.all([
      supabase
        .from("public_reviews")
        .select(
          "id, rating_overall, rating_difficulty, rating_fairness, would_take_again, is_anonymous, author_name, content, tags, created_at"
        )
        .eq("professor_id", professor.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("professor_replies")
        .select("review_id, content, created_at")
        .eq("professor_id", professor.id),
      professor.faculty_id
        ? supabase
            .from("faculties")
            .select("name_vi, name_en")
            .eq("id", professor.faculty_id)
            .single()
        : Promise.resolve({ data: null }),
      supabase.auth.getUser(),
    ]);
  const replyMap = new Map(
    (replies ?? []).map((r) => [r.review_id as string, r])
  );

  let verification: string | null = null;
  if (auth?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification")
      .eq("id", auth.user.id)
      .single();
    verification = profile?.verification ?? null;
  }
  const authState = !auth?.user
    ? "logged_out"
    : verification === "none"
      ? "unverified"
      : "ok";

  const reviewList = (reviews ?? []) as PublicReview[];
  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviewList.filter((r) => r.rating_overall === star).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));
  const wtaPct =
    professor.would_take_again_pct ??
    (() => {
      const known = reviewList.filter((r) => r.would_take_again !== null);
      if (known.length === 0) return null;
      return Math.round(
        (known.filter((r) => r.would_take_again).length / known.length) * 100
      );
    })();

  const displayName =
    `${professor.academic_title ? professor.academic_title + " " : ""}${professor.full_name}`.trim();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="card relative mb-8 overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-indigo-500/90 via-violet-500/80 to-fuchsia-500/70" />
        <div className="relative flex items-start gap-5 pt-8">
          <Avatar name={professor.full_name} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {displayName}
              {professor.source_status === "user_created" && (
                <span className="badge ml-2 bg-amber-100 align-middle text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {dict.professor.unverifiedLabel}
                </span>
              )}
            </h1>
            {faculty && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {locale === "en" && faculty.name_en ? faculty.name_en : faculty.name_vi}
              </p>
            )}
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {interpolate(dict.professor.reviewCount, {
                count: professor.review_count,
              })}
            </p>
          </div>
          <Link
            href="/search"
            className="hidden shrink-0 self-start text-sm text-indigo-600 hover:underline dark:text-indigo-400 sm:block"
          >
            ← {dict.common.back}
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-6 rounded-2xl border border-zinc-200 p-6 sm:grid-cols-[auto_1fr] dark:border-zinc-700">
        <div className="flex flex-col items-center justify-center gap-1 border-zinc-200 pr-6 sm:border-r dark:border-zinc-700">
          <span className="text-5xl font-bold">
            {professor.avg_overall?.toFixed(1) ?? "–"}
          </span>
          <StarRating value={professor.avg_overall ?? 0} size="md" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {interpolate(dict.professor.reviewCount, {
              count: professor.review_count,
            })}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <ScoreBadge
              label={dict.professor.difficulty}
              value={
                professor.avg_difficulty
                  ? `${professor.avg_difficulty.toFixed(1)} (${difficultyLevel(professor.avg_difficulty, dict)})`
                  : dict.professor.notRated
              }
            />
            <ScoreBadge
              label={dict.professor.fairness}
              value={professor.avg_fairness?.toFixed(1) ?? dict.professor.notRated}
            />
            <ScoreBadge
              label={dict.professor.wouldTakeAgain}
              value={wtaPct !== null ? `${wtaPct}%` : dict.professor.notRated}
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">{dict.professor.starDistribution}</p>
            <div className="flex flex-col gap-1">
              {[...distribution].reverse().map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-right text-zinc-600 dark:text-zinc-400">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-zinc-500 dark:text-zinc-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {professor.bio && (
        <section className="mt-6">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {professor.bio}
          </p>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700">
        <ReviewForm
          professorSlug={professor.slug}
          dict={{ ...dict.reviewForm, tagsLabel: dict.tags.label, tagLabels: dict.tags }}
          authState={authState}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">
          {`${dict.professor.reviewsSection} (${reviewList.length})`}
        </h2>
        <div className="flex flex-col gap-4">
          {reviewList.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400">
              {dict.professor.noReviews}
            </p>
          )}
          {reviewList.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating_overall} />
                  <span className="font-medium">
                    {review.is_anonymous
                      ? dict.professor.anonymousAuthor
                      : review.author_name}
                  </span>
                </div>
                <time className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(review.created_at).toLocaleDateString(locale)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {review.content}
              </p>
              {Array.isArray(review.tags) && review.tags.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {(review.tags as string[]).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    >
                      {dict.tags[t as keyof typeof dict.tags] ?? t}
                    </span>
                  ))}
                </p>
              )}
              {replyMap.get(review.id) && (
                <blockquote className="mt-3 rounded-r-xl border-l-4 border-indigo-400 bg-zinc-50 py-2 pl-3 pr-2 text-sm dark:bg-zinc-800/60">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {displayName} ↩
                  </span>
                  <p className="mt-1 whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                    {replyMap.get(review.id)!.content as string}
                  </p>
                </blockquote>
              )}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {dict.professor.difficulty}: {review.rating_difficulty}/5
                  </span>
                  <span>
                    {dict.professor.fairness}: {review.rating_fairness}/5
                  </span>
                  {review.would_take_again !== null && (
                    <span>
                      {dict.professor.wouldTakeAgain}:{" "}
                      {review.would_take_again ? dict.professor.yes : dict.professor.no}
                    </span>
                  )}
                </div>
                <ReportButton reviewId={review.id} dict={dict.reportUi} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
