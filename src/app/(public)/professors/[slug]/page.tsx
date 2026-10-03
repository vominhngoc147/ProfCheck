import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary, getLocale, interpolate } from "@/i18n";
import { StarRating, ScoreBadge } from "@/components/star-rating";
import { Avatar } from "@/components/professor-card";
import { ReviewForm } from "@/components/review-form";
import { ReportButton } from "@/components/report-button";
import { ReviewComments, type CommentItem } from "@/components/review-comments";
import { SaveReviewButton } from "@/components/save-review-button";
import type { Dictionary } from "@/i18n";

type PublicReview = {
  id: string;
  rating_overall: number;
  rating_difficulty: number;
  rating_fairness: number;
  rating_clarity: number | null;
  rating_expertise: number | null;
  rating_support: number | null;
  purpose: string;
  program: string | null;
  allow_forum_reup: boolean;
  attendance_required: boolean | null;
  textbook_used: boolean | null;
  for_credit: boolean | null;
  would_take_again: boolean | null;
  is_anonymous: boolean;
  author_name: string | null;
  content: string;
  tags: string[] | null;
  course_code: string | null;
  created_at: string;
};

const REVIEW_PURPOSES = ["hoc_tap", "nckh", "kltn", "ttgk"] as const;

function purposeLabelOf(p: string, dict: Dictionary): string {
  if (p === "hoc_tap") return dict.search.purposeHocTap;
  if (p === "nckh") return dict.search.purposeNckh;
  if (p === "kltn") return dict.search.purposeKltn;
  if (p === "ttgk") return dict.search.purposeTtgk;
  return p;
}

function programLabelOf(p: string | null, dict: Dictionary): string | null {
  if (p === "clc") return dict.search.programClc;
  if (p === "cttt") return dict.search.programCttt;
  if (p === "dhnnqt") return dict.search.programDhnnqt;
  if (p === "chinh_quy") return dict.search.programChinhQuy;
  return null;
}

function difficultyLevel(value: number, dict: Dictionary): string {
  if (value <= 2.5) return dict.professor.easy;
  if (value <= 3.5) return dict.professor.moderate;
  return dict.professor.hard;
}

export default async function ProfessorPage({
  params,
  searchParams,
}: PageProps<"/professors/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawTab = typeof sp.tab === "string" ? sp.tab : "all";
  const tab =
    rawTab === "all" ||
    (REVIEW_PURPOSES as readonly string[]).includes(rawTab)
      ? rawTab
      : "all";
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: professor, error: profError } = await supabase
    .from("professors")
    .select(
       `id, slug, full_name, academic_title, bio, avatar_url, source_status,
       degrees, titles, awards, research_fields, research_interests,
       allow_forum_reup,
       review_count, avg_overall, avg_difficulty, avg_fairness, avg_clarity, would_take_again_pct,
       faculty_id`
    )
    .eq("slug", slug)
    .single();

  if (profError || !professor) notFound();

  const [{ data: reviews }, { data: replies }, { data: faculty }, profile, { data: taught }] =
    await Promise.all([
      supabase
        .from("public_reviews")
        .select(
          "id, rating_overall, rating_difficulty, rating_fairness, rating_clarity, rating_expertise, rating_support, purpose, program, allow_forum_reup, attendance_required, textbook_used, for_credit, would_take_again, is_anonymous, author_name, author_id, content, tags, course_code, created_at"
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
      getCurrentProfile(),
      supabase
        .from("professor_courses")
        .select("courses(code, name_vi)")
        .eq("professor_id", professor.id),
    ]);
  const replyMap = new Map(
    (replies ?? []).map((r) => [r.review_id as string, r])
  );

  const reviewIds = (reviews ?? []).map((r) => r.id as string);
  const [{ data: allComments }, { data: allAttachments }] =
    reviewIds.length > 0
      ? await Promise.all([
          supabase
            .from("public_review_comments")
            .select("id, review_id, content, is_anonymous, author_id, author_name, created_at")
            .in("review_id", reviewIds)
            .order("created_at", { ascending: true }),
          supabase
            .from("review_attachments")
            .select("id, review_id, file_url, file_type, file_name, file_size")
            .in("review_id", reviewIds)
            .order("created_at", { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }];
  type CommentRow = {
    id: string;
    review_id: string;
    content: string;
    is_anonymous: boolean;
    author_id: string | null;
    author_name: string | null;
    created_at: string;
  };
  type AttachmentRow = {
    id: string;
    review_id: string;
    file_url: string;
    file_type: string;
    file_name: string;
    file_size: number;
  };
  const commentMap = new Map<string, CommentRow[]>();
  for (const c of ((allComments ?? []) as unknown as CommentRow[])) {
    if (!commentMap.has(c.review_id)) commentMap.set(c.review_id, []);
    commentMap.get(c.review_id)!.push(c);
  }
  const attachmentMap = new Map<string, AttachmentRow[]>();
  for (const a of ((allAttachments ?? []) as unknown as AttachmentRow[])) {
    if (!attachmentMap.has(a.review_id)) attachmentMap.set(a.review_id, []);
    attachmentMap.get(a.review_id)!.push(a);
  }

  const verification = profile?.verification ?? null;
  const authState = !profile
    ? "logged_out"
    : verification === "none"
      ? "unverified"
      : "ok";

  const currentUserId = profile?.id ?? null;
  const canComment = authState === "ok";
  let savedIds = new Set<string>();
  let ownCommentIds = new Set<string>();
  if (currentUserId) {
    const [{ data: saved }, { data: ownComments }] = await Promise.all([
      supabase
        .from("saved_reviews")
        .select("review_id")
        .eq("user_id", currentUserId),
      supabase
        .from("review_comments")
        .select("id")
        .eq("author_id", currentUserId),
    ]);
    savedIds = new Set((saved ?? []).map((s) => s.review_id as string));
    ownCommentIds = new Set((ownComments ?? []).map((c) => c.id as string));
  }

  const reviewList = (reviews ?? []) as PublicReview[];

  // top tags across approved reviews (RMP-style popular tags)
  const tagCounts = new Map<string, number>();
  for (const r of reviewList) {
    for (const t of r.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviewList.filter((r) => Math.round(r.rating_overall) === star)
      .length,
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
          <Avatar name={professor.full_name} size="xl" src={professor.avatar_url} />
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
              label={dict.reviewExtra.clarityRating}
              value={professor.avg_clarity?.toFixed(1) ?? dict.professor.notRated}
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

          {topTags.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium">
                💬 {dict.tags.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topTags.map(([t, n]) => (
                  <span
                    key={t}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {dict.tags[t as keyof typeof dict.tags] ?? t}{" "}
                    <span className="text-zinc-400">({n})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {professor.bio && (
        <section className="mt-6">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {professor.bio}
          </p>
        </section>
      )}

      {((professor.degrees ?? []).length > 0 ||
        (professor.titles ?? []).length > 0 ||
        ((professor.research_fields ?? []).length > 0 ||
          (professor.research_interests ?? []).length > 0) ||
        (Array.isArray(professor.awards) && professor.awards.length > 0) ||
        (taught ?? []).length > 0) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {(professor.degrees ?? []).length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="mb-1 text-sm font-semibold">{dict.professor.degreesTitle}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {(professor.degrees as string[]).join(" · ")}
              </p>
            </div>
          )}
          {(professor.titles ?? []).length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="mb-1 text-sm font-semibold">{dict.professor.titlesTitle}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {(professor.titles as string[]).join(" · ")}
              </p>
            </div>
          )}
          {((professor.research_fields ?? []).length > 0 ||
            (professor.research_interests ?? []).length > 0) && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="mb-1 text-sm font-semibold">
                {dict.professor.researchFieldsTitle}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...((professor.research_fields ?? []) as string[]),
                  ...((professor.research_interests ?? []) as string[]),
                ]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .slice(0, 12)
                  .map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      {f}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {Array.isArray(professor.awards) && professor.awards.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="mb-1 text-sm font-semibold">{dict.professor.awardsTitle}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {(professor.awards as { year?: string; title: string; org?: string }[]).map(
                  (a, i) => (
                    <li key={i}>
                      {[a.year, a.title, a.org].filter(Boolean).join(" — ")}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          {(taught ?? []).length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700 sm:col-span-2">
              <p className="mb-1 text-sm font-semibold">{dict.professor.coursesTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {(taught as unknown as { courses: { code: string; name_vi: string } | { code: string; name_vi: string }[] | null }[]).map(
                  (t, i) => {
                    const c = Array.isArray(t.courses) ? t.courses[0] : t.courses;
                    return (
                      c && (
                        <Link
                          key={i}
                          href={`/search?course_code=${encodeURIComponent(c.code)}`}
                          className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:underline dark:bg-sky-950/60 dark:text-sky-300"
                        >
                          📘 {c.code}
                        </Link>
                      )
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700">
        <ReviewForm
          professorSlug={professor.slug}
          dict={{
            ...dict.reviewForm,
            ...dict.reviewExtra,
            tagsLabel: dict.tags.label,
            tagLabels: dict.tags,
            purposeHocTap: dict.search.purposeHocTap,
            purposeNckh: dict.search.purposeNckh,
            purposeKltn: dict.search.purposeKltn,
            purposeTtgk: dict.search.purposeTtgk,
            programClc: dict.search.programClc,
            programCttt: dict.search.programCttt,
            programDhnnqt: dict.search.programDhnnqt,
            programChinhQuy: dict.search.programChinhQuy,
            customTagsLabel: dict.customTags.label,
            customTagsPlaceholder: dict.customTags.placeholder,
            customTagsHint: dict.customTags.hint,
            imagesLabel: dict.attachments.imagesLabel,
            imagesHint: dict.attachments.imagesHint,
            docsLabel: dict.attachments.docsLabel,
            docsHint: dict.attachments.docsHint,
          }}
          wdict={{
            step1: dict.reviewForm.step1,
            step2: dict.reviewForm.step2,
            step3: dict.reviewForm.step3,
            next: dict.reviewForm.next,
            back: dict.reviewForm.back,
            courseCode: dict.reviewForm.courseCode,
            courseCodePlaceholder: dict.reviewForm.courseCodePlaceholder,
          }}
          authState={authState}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">
          {`${dict.professor.reviewsSection} (${reviewList.length})`}
        </h2>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Link
            href={`/professors/${professor.slug}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tab === "all" ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
          >
            {dict.professor.tabAll} ({reviewList.length})
          </Link>
          {REVIEW_PURPOSES.map((p) => {
            const n = reviewList.filter((r) => r.purpose === p).length;
            if (n === 0) return null;
            return (
              <Link
                key={p}
                href={`/professors/${professor.slug}?tab=${p}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${tab === p ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
              >
                {purposeLabelOf(p, dict)} ({n})
              </Link>
            );
          })}
        </div>
        {(() => {
          const visible =
            tab === "all"
              ? reviewList
              : reviewList.filter((r) => r.purpose === tab);
          const avg = (f: (r: PublicReview) => number | null) => {
            const vals = visible.map(f).filter((v): v is number => v !== null);
            if (vals.length === 0) return null;
            return vals.reduce((a, b) => a + b, 0) / vals.length;
          };
          const tabOverall = avg((r) => r.rating_overall);
          const tabExpertise = avg((r) => r.rating_expertise);
          const tabSupport = avg((r) => r.rating_support);
          const tabDifficulty = avg((r) => r.rating_difficulty);
          const tabFairness = avg((r) => r.rating_fairness);
          const tabClarity = avg((r) => r.rating_clarity);
          return (
            <>
              {tab !== "all" && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40">
                  <StarRating value={tabOverall ?? 0} />
                  <span className="text-lg font-bold">
                    {tabOverall?.toFixed(1) ?? "–"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {purposeLabelOf(tab, dict)} · {visible.length}
                  </span>
                  {[
                    [dict.reviewExtra.clarityRating, tabClarity],
                    [dict.professor.difficulty, tabDifficulty],
                    [dict.professor.fairness, tabFairness],
                    [dict.reviewExtra.expertiseLabel, tabExpertise],
                    [dict.reviewExtra.supportLabel, tabSupport],
                  ]
                    .filter(([, v]) => v !== null)
                    .map(([label, v]) => (
                      <span
                        key={label as string}
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {label}: {(v as number).toFixed(1)}
                      </span>
                    ))}
                </div>
              )}
              <div className="flex flex-col gap-4">
                {visible.length === 0 && (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {dict.professor.noReviews}
                  </p>
                )}
                {visible.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    dict={dict}
                    locale={locale}
                    displayName={displayName}
                    reply={replyMap.get(review.id)}
                    comments={(commentMap.get(review.id) ?? []).map((c) => ({
                      id: c.id,
                      content: c.content,
                      is_anonymous: c.is_anonymous,
                      author_name: c.author_name,
                      created_at: c.created_at,
                      mine: ownCommentIds.has(c.id),
                    }))}
                    attachments={(attachmentMap.get(review.id) ?? []).map((a) => ({
                      id: a.id,
                      file_url: a.file_url,
                      file_type: a.file_type as "image" | "doc",
                      file_name: a.file_name,
                      file_size: a.file_size,
                    }))}
                    saved={savedIds.has(review.id)}
                    loggedIn={!!currentUserId}
                    canComment={canComment}
                    professorSlug={professor.slug}
                    profAllowReup={professor.allow_forum_reup ?? true}
                  />
                ))}
              </div>
            </>
          );
        })()}
      </section>
    </div>
  );
}

function ReviewCard({
  review,
  dict,
  locale,
  displayName,
  reply,
  comments,
  attachments,
  saved,
  loggedIn,
  canComment,
  professorSlug,
  profAllowReup,
}: {
  review: PublicReview;
  dict: Dictionary;
  locale: string;
  displayName: string;
  reply?: { content: string };
  comments: CommentItem[];
  attachments: {
    id: string;
    file_url: string;
    file_type: "image" | "doc";
    file_name: string;
    file_size: number;
  }[];
  saved: boolean;
  loggedIn: boolean;
  canComment: boolean;
  professorSlug: string;
  profAllowReup: boolean;
}) {
  const programLabel = programLabelOf(review.program, dict);
  const images = attachments.filter((a) => a.file_type === "image");
  const docs = attachments.filter((a) => a.file_type === "doc");
  return (
    <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarRating value={review.rating_overall} />
          <span className="font-medium">
            {review.is_anonymous
              ? dict.professor.anonymousAuthor
              : review.author_name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {review.allow_forum_reup && profAllowReup && (
            <Link
              href={`/forum/new?reup=${review.id}`}
              className="text-xs text-zinc-400 hover:text-violet-500 dark:text-zinc-500"
              title={dict.forum.reupTitle}
            >
              🔁 {dict.forum.reupButton}
            </Link>
          )}
          <SaveReviewButton
            reviewId={review.id}
            initialSaved={saved}
            loggedIn={loggedIn}
            dict={dict.saved}
          />
          <time className="text-xs text-zinc-500 dark:text-zinc-400">
            {new Date(review.created_at).toLocaleDateString(locale)}
          </time>
        </div>
      </div>
      <p className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
          {purposeLabelOf(review.purpose, dict)}
        </span>
        {review.course_code && (
          <span className="badge bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
            📘 {review.course_code}
          </span>
        )}
        {programLabel && (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
            {programLabel}
          </span>
        )}
      </p>
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
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.file_url}
              target="_blank"
              rel="noreferrer"
              title={img.file_name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.file_url}
                alt={img.file_name}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
            </a>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <div className="mt-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
          <p className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            📎 {dict.attachments.docsTitle}
          </p>
          <ul className="space-y-1">
            {docs.map((d) => (
              <li key={d.id} className="text-xs">
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {d.file_name}
                </a>
                <span className="ml-1.5 text-zinc-400">
                  ({(d.file_size / 1024).toFixed(0)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ReviewComments
        reviewId={review.id}
        professorSlug={professorSlug}
        comments={comments}
        canComment={canComment}
        dict={dict.comments}
      />
      {reply && (
        <blockquote className="mt-3 rounded-r-xl border-l-4 border-indigo-400 bg-zinc-50 py-2 pl-3 pr-2 text-sm dark:bg-zinc-800/60">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {displayName} ↩
          </span>
          <p className="mt-1 whitespace-pre-line text-zinc-600 dark:text-zinc-300">
            {reply.content}
          </p>
        </blockquote>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {dict.reviewForm.overallRating}: {review.rating_overall}/5
          </span>
          {review.rating_clarity !== null && (
            <span>
              {dict.reviewExtra.clarityRating}: {review.rating_clarity}/5
            </span>
          )}
          <span>
            {dict.professor.difficulty}: {review.rating_difficulty}/5
          </span>
          <span>
            {dict.professor.fairness}: {review.rating_fairness}/5
          </span>
          {review.rating_expertise !== null && (
            <span>
              {dict.reviewExtra.expertiseLabel}: {review.rating_expertise}/5
            </span>
          )}
          {review.rating_support !== null && (
            <span>
              {dict.reviewExtra.supportLabel}: {review.rating_support}/5
            </span>
          )}
          {review.would_take_again !== null && (
            <span>
              {dict.professor.wouldTakeAgain}:{" "}
              {review.would_take_again ? dict.professor.yes : dict.professor.no}
            </span>
          )}
          {review.attendance_required !== null && (
            <span>
              {dict.reviewExtra.attendanceLabel}{" "}
              {review.attendance_required ? dict.reviewExtra.yes : dict.reviewExtra.no}
            </span>
          )}
          {review.textbook_used !== null && (
            <span>
              {dict.reviewExtra.textbookLabel}{" "}
              {review.textbook_used ? dict.reviewExtra.yes : dict.reviewExtra.no}
            </span>
          )}
          {review.for_credit !== null && (
            <span>
              {dict.reviewExtra.creditLabel}{" "}
              {review.for_credit ? dict.reviewExtra.yes : dict.reviewExtra.no}
            </span>
          )}
        </div>
        <ReportButton reviewId={review.id} dict={dict.reportUi} />
      </div>
    </article>
  );
}
