import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale, interpolate } from "@/i18n";
import { ProfessorCard } from "@/components/professor-card";
import { SortSelect } from "@/components/sort-select";

export const metadata = { title: "Tìm kiếm" };

const PURPOSES = ["hoc_tap", "nckh", "kltn", "ttgk"] as const;
const PROGRAMS = ["clc", "cttt", "dhnnqt", "chinh_quy"] as const;

function purposeLabel(p: string, dict: Awaited<ReturnType<typeof getDictionary>>["search"]) {
  if (p === "hoc_tap") return dict.purposeHocTap;
  if (p === "nckh") return dict.purposeNckh;
  if (p === "kltn") return dict.purposeKltn;
  if (p === "ttgk") return dict.purposeTtgk;
  return p;
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const params = await searchParams;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const q = str(params.q);
  const faculty = str(params.faculty);
  const school = str(params.school);
  const courseCode = str(params.course_code);
  const courseName = str(params.course_name);
  const program = str(params.program);
  const field = str(params.field);
  const rawPurpose = str(params.purpose);
  const purpose = rawPurpose && (PURPOSES as readonly string[]).includes(rawPurpose)
    ? rawPurpose
    : undefined;
  const sort = str(params.sort) ?? "reviews";
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: schools }, { data: allFaculties }] = await Promise.all([
    supabase.from("schools").select("id, slug, name_vi, name_en").eq("is_active", true).order("name_vi"),
    supabase.from("faculties").select("id, slug, name_vi, school_id"),
  ]);

  let schoolId: string | null = null;
  if (school) {
    const s = (schools ?? []).find((x) => x.slug === school);
    if (s) schoolId = s.id;
  }

  let query = supabase
    .from("professors")
    .select(
      "id, slug, full_name, academic_title, avatar_url, source_status, review_count, avg_overall, avg_difficulty, faculty_id"
    )
    .limit(50);

  if (sort === "rating")
    query = query.order("avg_overall", { ascending: false, nullsFirst: false });
  else if (sort === "name") query = query.order("full_name");
  else query = query.order("review_count", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);
  if (schoolId) query = query.eq("school_id", schoolId);

  let facultyName: string | null = null;
  if (faculty) {
    const f = (allFaculties ?? []).find((x) => x.slug === faculty);
    if (f) {
      facultyName = f.name_vi;
      query = query.eq("faculty_id", f.id);
    }
  }

  // Course code/name -> professor ids via professor_courses
  if (courseCode || courseName) {
    let courseQuery = supabase.from("courses").select("id");
    if (courseCode) courseQuery = courseQuery.ilike("code", `%${courseCode}%`);
    if (courseName) courseQuery = courseQuery.ilike("name_vi", `%${courseName}%`);
    const { data: matchedCourses } = await courseQuery.limit(100);
    const courseIds = (matchedCourses ?? []).map((c) => c.id);
    if (courseIds.length === 0) {
      // force empty result
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    } else {
      const { data: links } = await supabase
        .from("professor_courses")
        .select("professor_id")
        .in("course_id", courseIds)
        .limit(500);
      const profIds = [...new Set((links ?? []).map((l) => l.professor_id))];
      // also match reviews.course_code directly (pre-sync rows)
      if (courseCode) {
        const { data: revMatch } = await supabase
          .from("public_reviews")
          .select("professor_id")
          .ilike("course_code", `%${courseCode}%`)
          .limit(500);
        for (const r of revMatch ?? []) {
          const pid = r.professor_id as string;
          if (!profIds.includes(pid)) profIds.push(pid);
        }
      }
      if (profIds.length === 0) {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        query = query.in("id", profIds);
      }
    }
  }

  // purpose/program -> professor ids via reviews
  if (purpose || program) {
    let revQuery = supabase.from("public_reviews").select("professor_id");
    if (purpose) revQuery = revQuery.eq("purpose", purpose);
    if (program) revQuery = revQuery.eq("program", program);
    const { data: revRows } = await revQuery.limit(1000);
    const profIds = [...new Set((revRows ?? []).map((r) => r.professor_id as string))];
    if (profIds.length === 0) {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("id", profIds);
    }
  }

  const { data: professorsRaw } = await query;
  let professors = professorsRaw ?? [];

  // NCKH field filter (partial match on research arrays, in-JS for flexibility)
  if (field) {
    const needle = field.toLowerCase();
    const ids = professors.map((p) => p.id);
    if (ids.length > 0) {
      const { data: full } = await supabase
        .from("professors")
        .select("id, research_fields, research_interests")
        .in("id", ids);
      const ok = new Set(
        (full ?? [])
          .filter((r) => {
            const arr = [
              ...((r.research_fields ?? []) as string[]),
              ...((r.research_interests ?? []) as string[]),
            ];
            return arr.some((x) => x.toLowerCase().includes(needle));
          })
          .map((r) => r.id)
      );
      professors = professors.filter((p) => ok.has(p.id));
    }
  }

  const facultyMap = new Map((allFaculties ?? []).map((f) => [f.id, f.name_vi]));
  const isNckh = purpose === "nckh";

  const baseParams = new URLSearchParams();
  if (sort !== "reviews") baseParams.set("sort", sort);

  function tabHref(p?: string) {
    const sp = new URLSearchParams(baseParams);
    if (q) sp.set("q", q);
    if (school) sp.set("school", school);
    if (faculty) sp.set("faculty", faculty);
    if (courseCode) sp.set("course_code", courseCode);
    if (courseName) sp.set("course_name", courseName);
    if (program) sp.set("program", program);
    if (field) sp.set("field", field);
    if (p) sp.set("purpose", p);
    const s = sp.toString();
    return s ? `/search?${s}` : "/search";
  }

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

      {/* purpose tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Link
          href={tabHref(undefined)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${!purpose ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
        >
          {dict.search.purposeAll}
        </Link>
        {PURPOSES.map((p) => (
          <Link
            key={p}
            href={tabHref(p)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${purpose === p ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"}`}
          >
            {purposeLabel(p, dict.search)}
          </Link>
        ))}
      </div>

      {/* filter form */}
      <form method="GET" action="/search" className="card mt-4 grid gap-3 p-4 sm:grid-cols-3">
        {purpose && <input type="hidden" name="purpose" value={purpose} />}
        {sort !== "reviews" && <input type="hidden" name="sort" value={sort} />}
        <label className="flex flex-col gap-1 text-xs">
          {dict.search.nameLabel}
          <input type="text" name="q" defaultValue={q ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          {dict.search.schoolLabel}
          <select name="school" defaultValue={school ?? ""} className="input">
            <option value="">—</option>
            {(schools ?? []).map((s) => (
              <option key={s.id} value={s.slug}>
                {locale === "en" && s.name_en ? s.name_en : s.name_vi}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          {dict.search.facultyLabel}
          <select name="faculty" defaultValue={faculty ?? ""} className="input">
            <option value="">—</option>
            {(allFaculties ?? [])
              .filter((f) => !schoolId || f.school_id === schoolId)
              .map((f) => (
                <option key={f.id} value={f.slug}>
                  {f.name_vi}
                </option>
              ))}
          </select>
        </label>
        {!isNckh && (
          <>
            <label className="flex flex-col gap-1 text-xs">
              {dict.search.courseCodeLabel}
              <input type="text" name="course_code" defaultValue={courseCode ?? ""} className="input" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {dict.search.courseNameLabel}
              <input type="text" name="course_name" defaultValue={courseName ?? ""} className="input" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {dict.search.programLabel}
              <select name="program" defaultValue={program ?? ""} className="input">
                <option value="">{dict.search.programAll}</option>
                {PROGRAMS.map((p) => (
                  <option key={p} value={p}>
                    {p === "clc" ? dict.search.programClc : p === "cttt" ? dict.search.programCttt : p === "dhnnqt" ? dict.search.programDhnnqt : dict.search.programChinhQuy}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {isNckh && (
          <label className="flex flex-col gap-1 text-xs sm:col-span-3">
            {dict.search.fieldLabel}
            <input type="text" name="field" defaultValue={field ?? ""} className="input" />
          </label>
        )}
        <div className="flex gap-2 sm:col-span-3">
          <button type="submit" className="btn-primary">
            {dict.search.filterButton}
          </button>
          <Link href="/search" className="btn-secondary">
            {dict.search.resetButton}
          </Link>
        </div>
      </form>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        {professors.length > 0 &&
          interpolate(dict.search.resultCount, { count: professors.length })}
      </p>

      <div className="mt-6 grid gap-3">
        {professors.map((p) => (
          <ProfessorCard
            key={p.id}
            professor={p}
            facultyName={p.faculty_id ? (facultyMap.get(p.faculty_id) ?? null) : null}
          />
        ))}
      </div>

      {professors.length === 0 && (
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
