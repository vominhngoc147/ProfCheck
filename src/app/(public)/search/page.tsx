import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";
import { ProfessorCard } from "@/components/professor-card";
import { SortSelect } from "@/components/sort-select";

export const metadata = { title: "Tìm kiếm" };

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const faculty =
    typeof params.faculty === "string" ? params.faculty : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "reviews";
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  let query = supabase
    .from("professors")
    .select(
      "id, slug, full_name, academic_title, source_status, review_count, avg_overall, avg_difficulty, faculty_id"
    )
    .limit(50);

  if (sort === "rating")
    query = query.order("avg_overall", { ascending: false, nullsFirst: false });
  else if (sort === "name") query = query.order("full_name");
  else query = query.order("review_count", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);

  let facultyName: string | null = null;
  if (faculty) {
    const { data: f } = await supabase
      .from("faculties")
      .select("id, name_vi, name_en")
      .eq("slug", faculty)
      .single();
    if (f) {
      facultyName = locale === "en" && f.name_en ? f.name_en : f.name_vi;
      query = query.eq("faculty_id", f.id);
    }
  }

  const { data: professors } = await query;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {facultyName
            ? facultyName
            : q
              ? interpolate(dict.search.resultsFor, { q })
              : dict.search.title}
        </h1>
        <SortSelect labels={dict.searchUi} />
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {(professors ?? []).length > 0 &&
          interpolate(dict.search.resultCount, {
            count: (professors ?? []).length,
          })}
      </p>

      <div className="mt-6 grid gap-3">
        {(professors ?? []).map((p) => (
          <ProfessorCard key={p.id} professor={p} />
        ))}
      </div>

      {(professors ?? []).length === 0 && (
        <div className="card mt-10 p-8 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            {q ? interpolate(dict.search.noResults, { q }) : dict.search.emptyQuery}
          </p>
          <Link
            href="/join/professor?create=1"
            className="btn-primary mt-4 inline-flex"
          >
            + {dict.searchUi.addProfessorCta}
          </Link>
        </div>
      )}
    </div>
  );
}
