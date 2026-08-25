import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOwnedProfessor } from "@/lib/auth";
import { getDictionary, interpolate } from "@/i18n";
import { NewOpportunityForm } from "@/components/opportunity-form";
import { OpportunityActions } from "@/components/opportunity-actions";

const TYPE_LABEL_KEYS = {
  nckh: "typeNckh",
  kltn: "typeKltn",
  luan_van: "typeLuanVan",
  thuc_tap: "typeThucTap",
  khac: "typeKhac",
} as const;

export default async function ProfSlotsPage() {
  const { professor } = await getOwnedProfessor();
  const dict = await getDictionary();
  if (!professor) return null;

  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, type, title, description, tags, slots_total, slots_left, deadline, status, applications(count)"
    )
    .eq("professor_id", professor.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-700">
        <h2 className="mb-4 font-semibold">{dict.profDash.newOpportunity}</h2>
        <NewOpportunityForm dict={dict.profDash} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{dict.profDash.opportunitiesTitle}</h2>
        <div className="flex flex-col gap-3">
          {(opportunities ?? []).length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {dict.profDash.noOpportunities}
            </p>
          )}
          {(opportunities ?? []).map((o) => {
            const appCount =
              Array.isArray(o.applications) && o.applications[0]
                ? (o.applications[0] as { count: number }).count
                : 0;
            const typeKey =
              TYPE_LABEL_KEYS[o.type as keyof typeof TYPE_LABEL_KEYS];
            return (
              <article
                key={o.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {typeKey ? dict.profDash[typeKey] : o.type}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        o.status === "open"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {o.status === "open"
                        ? dict.profDash.statusOpen
                        : dict.profDash.statusClosed}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {interpolate(dict.profDash.slotsLeft, {
                      left: o.slots_left,
                      total: o.slots_total,
                    })}
                    {" · "}
                    {`${dict.profDash.applications}: ${appCount}`}
                  </span>
                </div>
                <h3 className="mt-2 font-medium">{o.title}</h3>
                {o.description && (
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                    {o.description}
                  </p>
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
                <div className="mt-3">
                  <OpportunityActions
                    id={o.id}
                    isOpen={o.status === "open"}
                    labels={{
                      close: dict.profDash.closeOpp,
                      reopen: dict.profDash.reopenOpp,
                      del: dict.profDash.deleteOpp,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Link
        href="/prof"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {dict.profDash.backToDash}
      </Link>
    </div>
  );
}
