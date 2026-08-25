import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { ClaimButton, CreateForm } from "@/components/join-professor";

export const metadata = { title: "Đăng ký hồ sơ giảng viên" };

export default async function JoinProfessorPage({
  searchParams,
}: PageProps<"/join/professor">) {
  const params = await searchParams;
  const dict = await getDictionary();
  await requireProfile();

  const supabase = await createClient();
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const showCreate = params.create === "1";

  let candidates: {
    id: string;
    slug: string;
    full_name: string;
    academic_title: string | null;
    source_status: string;
    faculty_name: string | null;
  }[] = [];
  if (q) {
    const { data } = await supabase
      .from("professors")
      .select(
        "id, slug, full_name, academic_title, source_status, faculties(name_vi)"
      )
      .ilike("full_name", `%${q}%`)
      .limit(10);
    candidates = (data ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      full_name: p.full_name,
      academic_title: p.academic_title,
      source_status: p.source_status,
      faculty_name:
        p.faculties && !Array.isArray(p.faculties)
          ? (p.faculties as { name_vi: string | null }).name_vi
          : null,
    }));
  }

  const { data: faculties } = await supabase
    .from("faculties")
    .select("id, name_vi")
    .order("name_vi");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">{dict.onboarding.ctaTitle}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {dict.onboarding.ctaDesc}
      </p>

      {!showCreate && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {dict.onboarding.searchTitle}
          </h2>
          <form method="get" className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={dict.onboarding.searchPlaceholder}
              className="h-11 flex-1 rounded-full border border-zinc-300 bg-transparent px-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {dict.onboarding.searchButton}
            </button>
          </form>

          {q && (
            <div className="mt-6 flex flex-col gap-3">
              {candidates.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {dict.onboarding.notFound}
                </p>
              )}
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <p className="font-semibold">
                    {c.academic_title ? `${c.academic_title} ` : ""}
                    {c.full_name}
                  </p>
                  {c.faculty_name && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {c.faculty_name}
                    </p>
                  )}
                  <ClaimButton professorId={c.id} dict={dict.onboarding} />
                </div>
              ))}
            </div>
          )}

          <p className="mt-8 text-center">
            <Link
              href="/join/professor?create=1"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {dict.onboarding.createInstead}
            </Link>
          </p>
        </section>
      )}

      {showCreate && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {dict.onboarding.ctaTitle}
          </h2>
          <CreateForm
            dict={dict.onboarding}
            faculties={faculties ?? []}
          />
        </section>
      )}
    </div>
  );
}
