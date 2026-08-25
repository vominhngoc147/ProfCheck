import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";

export default async function Home() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: faculties }, { data: professors }, reviewsCount] =
    await Promise.all([
      supabase
        .from("faculties")
        .select("id, slug, name_vi, name_en")
        .order("name_vi"),
      supabase.from("professors").select("faculty_id"),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
    ]);

  const profCountByFaculty = new Map<string, number>();
  for (const p of professors ?? []) {
    if (p.faculty_id)
      profCountByFaculty.set(
        p.faculty_id,
        (profCountByFaculty.get(p.faculty_id) ?? 0) + 1
      );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="flex flex-col items-center py-12 text-center">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          {dict.home.heroSubtitle}
        </p>
        <form action="/search" method="get" className="mt-8 flex w-full max-w-lg gap-2">
          <input
            type="search"
            name="q"
            placeholder={dict.home.searchPlaceholder}
            className="h-12 flex-1 rounded-full border border-zinc-300 bg-transparent px-5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600"
          />
          <button
            type="submit"
            className="h-12 rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {dict.common.search}
          </button>
        </form>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          {dict.home.verifiedOnlyNote}
        </p>
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-xl font-semibold">{dict.home.browseByFaculty}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(faculties ?? []).map((faculty) => (
            <Link
              key={faculty.id}
              href={`/search?faculty=${faculty.slug}`}
              className="rounded-xl border border-zinc-200 p-4 transition-shadow hover:shadow-md dark:border-zinc-700"
            >
              <p className="font-semibold">
                {locale === "en" && faculty.name_en ? faculty.name_en : faculty.name_vi}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {interpolate(dict.home.professors, {
                  count: profCountByFaculty.get(faculty.id) ?? 0,
                })}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-8">
        <h2 className="mb-6 text-xl font-semibold">{dict.home.howItWorksTitle}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: dict.home.step1Title, desc: dict.home.step1Desc },
            { title: dict.home.step2Title, desc: dict.home.step2Desc },
            { title: dict.home.step3Title, desc: dict.home.step3Desc },
          ].map((step, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {reviewsCount.count !== null && reviewsCount.count > 0 && (
        <p className="pt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {interpolate(dict.home.reviews, { count: reviewsCount.count })}
        </p>
      )}
    </div>
  );
}
