import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";
import { HeroIllustration, Icon } from "@/components/illustrations";
import { SchoolRateForm } from "@/components/school-rate-form";
import { getCurrentProfile } from "@/lib/auth";

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default async function Home() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: faculties }, { data: professors }, reviewsCount, schoolData] =
    await Promise.all([
      supabase
        .from("faculties")
        .select("id, slug, name_vi, name_en")
        .order("name_vi"),
      supabase
        .from("professors")
        .select(
          "id, slug, full_name, academic_title, source_status, review_count, avg_overall, avg_difficulty, faculty_id"
        )
        .order("review_count", { ascending: false })
        .limit(200),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("schools")
        .select(
          "id, name_vi, name_en, school_ratings(rating_quality, rating_social, rating_facilities)"
        )
        .eq("is_active", true)
        .limit(1)
        .single(),
    ]);
  const profile = await getCurrentProfile();
  const authState = !profile
    ? "logged_out"
    : profile.verification === "none"
      ? "unverified"
      : "ok";

  const ratings =
    ((schoolData?.data?.school_ratings ?? []) as Record<string, number>[]) ??
    [];
  const ratingAvg = (key: string) =>
    ratings.length === 0
      ? null
      : (
          ratings.reduce((sum, r) => sum + (r[key] ?? 0), 0) / ratings.length
        ).toFixed(1);

  const profCountByFaculty = new Map<string, number>();
  for (const p of professors ?? []) {
    if (p.faculty_id)
      profCountByFaculty.set(
        p.faculty_id,
        (profCountByFaculty.get(p.faculty_id) ?? 0) + 1
      );
  }

  const topProfessors = (professors ?? [])
    .filter((p) => p.review_count > 0)
    .sort((a, b) => (b.avg_overall ?? 0) - (a.avg_overall ?? 0))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* HERO */}
      <section className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {dict.home.heroTitle}
          </h1>
          <p className="mt-4 max-w-lg text-base text-zinc-600 dark:text-zinc-400">
            {dict.home.heroSubtitle}
          </p>
          <form action="/search" method="get" className="mt-8 flex max-w-lg gap-2">
            <input
              type="search"
              name="q"
              placeholder={dict.home.searchPlaceholder}
              className="input h-12 flex-1 !rounded-full !px-5"
            />
            <button type="submit" className="btn-primary h-12 shrink-0 !px-6">
              {dict.common.search}
            </button>
          </form>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Icon name="shield" className="h-3.5 w-3.5 text-emerald-500" />
            {dict.home.verifiedOnlyNote}
          </p>
        </div>
        <div className="hidden justify-center lg:flex">
          <HeroIllustration />
        </div>
      </section>

      {/* STATS BAND */}
      <section className="card grid grid-cols-3 divide-x divide-zinc-100 py-6 text-center dark:divide-zinc-800">
        {[
          { value: professors?.length ?? 0, label: dict.home2.statProfessors },
          { value: faculties?.length ?? 0, label: dict.home2.statFaculties },
          {
            value: reviewsCount.count ?? 0,
            label: dict.home2.statReviews,
          },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {s.value}
            </p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* TOP PROFESSORS */}
      {topProfessors.length > 0 && (
        <section className="py-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">🏆 {dict.home2.topProfessors}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topProfessors.map((p, i) => (
              <Link
                key={p.id}
                href={`/professors/${p.slug}`}
                className="card flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="w-6 text-center text-lg font-extrabold text-zinc-300 dark:text-zinc-600">
                  {i + 1}
                </span>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(p.full_name)}`}
                >
                  {p.full_name.split(" ").slice(-1)[0]?.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {p.academic_title ? `${p.academic_title}. ` : ""}
                    {p.full_name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ⭐ {(p.avg_overall ?? 0).toFixed(1)} ·{" "}
                    {interpolate(dict.professor.reviewCount, {
                      count: p.review_count,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FACULTIES */}
      <section className="py-8">
        <h2 className="section-title mb-5">{dict.home.browseByFaculty}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(faculties ?? []).map((faculty, i) => (
            <Link
              key={faculty.id}
              href={`/search?faculty=${faculty.slug}`}
              className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${
                  AVATAR_COLORS[i % AVATAR_COLORS.length]
                }`}
              >
                {(locale === "en" && faculty.name_en ? faculty.name_en : faculty.name_vi).charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {locale === "en" && faculty.name_en ? faculty.name_en : faculty.name_vi}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {interpolate(dict.home.professors, {
                    count: profCountByFaculty.get(faculty.id) ?? 0,
                  })}
                  {" →"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14">
        <h2 className="section-title mb-8 text-center">{dict.home.howItWorksTitle}</h2>
        <div className="relative grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: "shield",
              title: dict.home.step1Title,
              desc: dict.home.step1Desc,
              color: "bg-emerald-500",
            },
            {
              icon: "pen",
              title: dict.home.step2Title,
              desc: dict.home.step2Desc,
              color: "bg-indigo-500",
            },
            {
              icon: "rocket",
              title: dict.home.step3Title,
              desc: dict.home.step3Desc,
              color: "bg-amber-500",
            },
          ].map((step) => (
            <div key={step.title} className="card relative p-6 text-center">
              <span
                className={`mx-auto -mt-11 flex h-12 w-12 items-center justify-center rounded-2xl ${step.color} text-white shadow-lg`}
              >
                <Icon name={step.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCHOOL RATING (RMP-style campus ratings) */}
      {schoolData && (
        <section className="card mb-16 p-6">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
            <div className="flex-1">
              <h2 className="section-title">🏛️ {dict.home2.rateSchoolTitle}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {dict.home2.rateSchoolDesc}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {(
                  [
                    ["rating_quality", "avgQuality"],
                    ["rating_social", "avgSocial"],
                    ["rating_facilities", "avgFacilities"],
                  ] as const
                ).map(([col, label]) => {
                  const avg = ratingAvg(col);
                  return avg ? (
                    <span key={col} className="text-zinc-500 dark:text-zinc-400">
                      {dict.home2[label]}:{" "}
                      <b className="text-amber-500">{avg}/5</b> ({ratings.length})
                    </span>
                  ) : null;
                })}
                {ratings.length === 0 && (
                  <span className="text-xs text-zinc-400">
                    {dict.home2.noSchoolRatings}
                  </span>
                )}
              </div>
            </div>
            <SchoolRateForm
              schoolId={schoolData.data?.id ?? ""}
              dict={dict.home2}
              authState={authState}
            />
          </div>
        </section>
      )}

      {/* PROFESSOR CTA */}
      <section className="card mb-16 overflow-hidden">
        <div className="flex flex-col items-center gap-6 bg-gradient-to-r from-indigo-50 to-violet-50 p-8 text-center dark:from-indigo-950/40 dark:to-violet-950/40 sm:flex-row sm:text-left">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{dict.onboarding.ctaTitle}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {dict.onboarding.ctaDesc}
            </p>
          </div>
          <Link href="/join/professor" className="btn-primary shrink-0">
            {dict.onboarding.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
