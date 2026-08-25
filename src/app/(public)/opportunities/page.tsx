import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary, getLocale } from "@/i18n";
import { ApplyButton } from "@/components/apply-button";

export const metadata = { title: "Cơ hội từ giảng viên" };

const TYPES = ["nckh", "kltn", "luan_van", "thuc_tap", "khac"] as const;

const TYPE_LABEL_KEYS = {
  nckh: "typeNckh",
  kltn: "typeKltn",
  luan_van: "typeLuanVan",
  thuc_tap: "typeThucTap",
  khac: "typeKhac",
} as const;

export default async function OpportunitiesPage({
  searchParams,
}: PageProps<"/opportunities">) {
  const params = await searchParams;
  const typeFilter = typeof params.type === "string" ? params.type : null;
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select(
      "id, type, title, description, tags, slots_total, slots_left, deadline, created_at, professors(full_name, slug)"
    )
    .eq("status", "open")
    .gt("slots_left", 0)
    .order("created_at", { ascending: false });
  if (typeFilter && (TYPES as readonly string[]).includes(typeFilter))
    query = query.eq("type", typeFilter);

  const [{ data: opportunities }, profile] = await Promise.all([
    query,
    getCurrentProfile(),
  ]);
  const authState = !profile
    ? "logged_out"
    : profile.verification === "none"
      ? "unverified"
      : "ok";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{dict.opp.title}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {dict.opp.subtitle}
          </p>
        </div>
        <nav className="flex flex-wrap gap-1 text-xs">
          <Link
            href="/opportunities"
            className={`rounded-full px-3 py-1.5 ${
              !typeFilter
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {dict.opp.filterAll}
          </Link>
          {TYPES.map((t) => (
            <Link
              key={t}
              href={`/opportunities?type=${t}`}
              className={`rounded-full px-3 py-1.5 ${
                typeFilter === t
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {dict.profDash[TYPE_LABEL_KEYS[t]]}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {(opportunities ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {dict.opp.noOpps}
          </p>
        )}
        {(opportunities ?? []).map((o) => {
          const prof = Array.isArray(o.professors)
            ? o.professors[0]
            : o.professors;
          return (
            <article
              key={o.id}
              className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {dict.profDash[TYPE_LABEL_KEYS[o.type as keyof typeof TYPE_LABEL_KEYS]]}
                </span>
                {o.deadline && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {dict.opp.deadline}{" "}
                    {new Date(o.deadline).toLocaleDateString(locale)}
                  </span>
                )}
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  {o.slots_left}/{o.slots_total}
                </span>
              </div>
              <h2 className="mt-2 font-semibold">{o.title}</h2>
              {o.description && (
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                  {o.description}
                </p>
              )}
              {prof && (
                <Link
                  href={`/professors/${(prof as { slug: string }).slug}`}
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {(prof as { full_name: string }).full_name} ↗
                </Link>
              )}
              {o.tags.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1">
                  {o.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </p>
              )}
              <ApplyButton
                opportunityId={o.id}
                dict={dict.opp}
                authState={authState}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
