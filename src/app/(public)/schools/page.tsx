import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";

export default async function SchoolsPage() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, slug, name_vi, name_en, is_active")
    .eq("is_active", true)
    .order("name_vi");

  const schoolIds = (schools ?? []).map((s) => s.id);

  const [profCounts, reviewCounts] = await Promise.all([
    schoolIds.length > 0
      ? supabase
          .from("professors")
          .select("school_id")
          .in("school_id", schoolIds)
          .then(({ data }) => {
            const map = new Map<string, number>();
            for (const p of data ?? [])
              map.set(p.school_id, (map.get(p.school_id) ?? 0) + 1);
            return map;
          })
      : Promise.resolve(new Map<string, number>()),
    schoolIds.length > 0
      ? (async () => {
          const { data: profs } = await supabase
            .from("professors")
            .select("id, school_id")
            .in("school_id", schoolIds);
          const idToSchool = new Map<string, string>();
          for (const p of profs ?? []) idToSchool.set(p.id, p.school_id);
          const profIds = (profs ?? []).map((p) => p.id);
          if (profIds.length === 0) return new Map<string, number>();
          const { data: reviews } = await supabase
            .from("reviews")
            .select("professor_id")
            .eq("status", "approved")
            .in("professor_id", profIds);
          const map = new Map<string, number>();
          for (const r of reviews ?? []) {
            const sid = idToSchool.get(r.professor_id);
            if (sid) map.set(sid, (map.get(sid) ?? 0) + 1);
          }
          return map;
        })()
      : Promise.resolve(new Map<string, number>()),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        🏫 {dict.schools?.title ?? "Trường đại học"}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {dict.schools?.subtitle ?? "Chọn trường để xem khoa và giảng viên"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(schools ?? []).map((school) => {
          const name = locale === "en" && school.name_en ? school.name_en : school.name_vi;
          const profCount = profCounts.get(school.id) ?? 0;
          const reviewCount = reviewCounts.get(school.id) ?? 0;
          return (
            <Link
              key={school.id}
              href={`/schools/${school.slug}`}
              className="card group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                🎓
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>👨‍🏫 {interpolate(dict.home.professors, { count: profCount })}</span>
                  <span>💬 {reviewCount} {dict.home.reviews}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(!schools || schools.length === 0) && (
        <div className="card mt-8 p-10 text-center text-sm text-zinc-400">
          {dict.schools?.empty ?? "Chưa có trường nào."}
        </div>
      )}
    </div>
  );
}
