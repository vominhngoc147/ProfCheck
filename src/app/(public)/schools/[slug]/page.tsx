import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-rose-500", "bg-emerald-500",
  "bg-amber-500", "bg-sky-500", "bg-violet-500",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("id, slug, name_vi, name_en, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!school) notFound();

  const name = locale === "en" && school.name_en ? school.name_en : school.name_vi;

  const [{ data: faculties }, { data: professors }, reviewsResult] = await Promise.all([
    supabase
      .from("faculties")
      .select("id, slug, name_vi, name_en")
      .eq("school_id", school.id)
      .order("name_vi"),
    supabase
      .from("professors")
      .select("id, slug, full_name, academic_title, review_count, avg_overall, faculty_id")
      .eq("school_id", school.id)
      .order("review_count", { ascending: false })
      .limit(200),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .in(
        "professor_id",
        (
          await supabase
            .from("professors")
            .select("id")
            .eq("school_id", school.id)
        ).data?.map((p) => p.id) ?? []
      ),
  ]);

  const profCountByFaculty = new Map<string, number>();
  for (const p of professors ?? []) {
    if (p.faculty_id)
      profCountByFaculty.set(p.faculty_id, (profCountByFaculty.get(p.faculty_id) ?? 0) + 1);
  }

  const topProfessors = (professors ?? [])
    .filter((p) => p.review_count > 0)
    .sort((a, b) => (b.avg_overall ?? 0) - (a.avg_overall ?? 0))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 text-sm text-zinc-400">
        <Link href="/schools" className="hover:text-indigo-500">Trường</Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-700 dark:text-zinc-200">{name}</span>
      </nav>

      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          🎓
        </span>
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{name}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {interpolate(dict.home.professors, { count: professors?.length ?? 0 })}
            {" · "}
            {(reviewsResult.count ?? 0)} {dict.home.reviews}
          </p>
        </div>
      </div>

      {/* FACULTIES */}
      {(faculties ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4">{dict.home.browseByFaculty}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(faculties ?? []).map((faculty, i) => {
              const fname = locale === "en" && faculty.name_en ? faculty.name_en : faculty.name_vi;
              return (
                <Link
                  key={faculty.id}
                  href={`/search?faculty=${faculty.slug}`}
                  className="card group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white ${
                      AVATAR_COLORS[i % AVATAR_COLORS.length]
                    }`}
                  >
                    {fname.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {fname}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {interpolate(dict.home.professors, {
                        count: profCountByFaculty.get(faculty.id) ?? 0,
                      })}{" "}
                      →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TOP PROFESSORS */}
      {topProfessors.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4">🏆 {dict.home2.topProfessors}</h2>
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
                    {interpolate(dict.professor.reviewCount, { count: p.review_count })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ALL PROFESSORS */}
      {(professors ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4">
            👨‍🏫 {dict.professors?.all ?? "Tất cả giảng viên"}{" "}
            <span className="text-sm font-normal text-zinc-400">
              ({professors?.length ?? 0})
            </span>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(professors ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/professors/${p.slug}`}
                className="card flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(p.full_name)}`}
                >
                  {p.full_name.split(" ").slice(-1)[0]?.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.academic_title ? `${p.academic_title} ` : ""}
                    {p.full_name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {p.review_count > 0
                      ? `⭐ ${(p.avg_overall ?? 0).toFixed(1)} · ${p.review_count} reviews`
                      : dict.professor.notRated}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
