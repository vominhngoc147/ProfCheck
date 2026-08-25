import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import {
  moderateReviewAction,
  decideClaimAction,
  decideCardAction,
  resolveReportAction,
} from "@/app/actions/admin";

export const metadata = { title: "Admin" };

function ActionButtons({
  actions,
}: {
  actions: { label: string; action: () => Promise<void>; danger?: boolean }[];
}) {
  return (
    <div className="mt-3 flex gap-2">
      {actions.map((a, i) => (
        <form key={i} action={a.action}>
          <button
            type="submit"
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
              a.danger
                ? "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  await requireRole("moderator", "admin");
  const dict = await getDictionary();
  const supabase = await createClient();

  const [
    { data: pendingReviews },
    { data: pendingClaims },
    { data: pendingCards },
    { data: openReports },
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, professor_id, content, is_anonymous, rating_overall, created_at"
      )
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("professor_claims")
      .select("id, professor_id, claimant_id, evidence_url, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("profiles")
      .select("id, display_name, student_card_url")
      .eq("verification", "card_pending"),
    supabase
      .from("reports")
      .select("id, review_id, reason, details, created_at")
      .eq("status", "open")
      .order("created_at"),
  ]);

  // enrich claims + reviews with professor info via staff-readable queries
  const allProfIds = [
    ...new Set([
      ...(pendingClaims ?? []).map((c) => c.professor_id),
      ...(pendingReviews ?? []).map((r) => r.professor_id),
    ]),
  ];
  const claimantIds = [...new Set((pendingClaims ?? []).map((c) => c.claimant_id))];
  const profMap = new Map<string, { full_name: string; slug: string }>();
  const claimantMap = new Map<string, string>();
  if (allProfIds.length) {
    const { data: profs } = await supabase
      .from("professors")
      .select("id, full_name, slug")
      .in("id", allProfIds);
    (profs ?? []).forEach((p) => profMap.set(p.id, p));
  }
  if (claimantIds.length) {
    // staff can read profiles via prof_select policy (is_staff)
    const { data: people } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", claimantIds);
    (people ?? []).forEach((p) => claimantMap.set(p.id, p.display_name));
  }

  const queuesEmpty =
    (pendingReviews ?? []).length +
      (pendingClaims ?? []).length +
      (pendingCards ?? []).length +
      (openReports ?? []).length ===
    0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      {queuesEmpty && (
        <p className="mt-6 rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {dict.adminUi.empty}
        </p>
      )}

      {/* Reviews */}
      {(pendingReviews ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">
            {dict.adminUi.reviewsQueue} ({pendingReviews!.length})
          </h2>
          <div className="flex flex-col gap-3">
            {(pendingReviews ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{"★".repeat(r.rating_overall)}</span>
                  <span>{r.is_anonymous ? dict.professor.anonymousAuthor : ""}</span>
                  {profMap.get(r.professor_id) && (
                    <Link
                      href={`/professors/${profMap.get(r.professor_id)!.slug}`}
                      className="hover:underline"
                    >
                      {profMap.get(r.professor_id)!.full_name}
                    </Link>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm">{r.content}</p>
                <ActionButtons
                  actions={[
                    {
                      label: dict.adminUi.approve,
                      action: () => moderateReviewAction(r.id, "approved"),
                    },
                    {
                      label: dict.adminUi.reject,
                      action: () => moderateReviewAction(r.id, "rejected"),
                      danger: true,
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Claims */}
      {(pendingClaims ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">
            {dict.adminUi.claimsQueue} ({pendingClaims!.length})
          </h2>
          <div className="flex flex-col gap-3">
            {(pendingClaims ?? []).map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <p className="text-sm">
                  <b>{dict.adminUi.claimant}:</b>{" "}
                  {claimantMap.get(c.claimant_id) ?? c.claimant_id.slice(0, 8)}
                </p>
                <p className="text-sm">
                  <b>{dict.adminUi.professor}:</b>{" "}
                  {profMap.get(c.professor_id)?.full_name ?? c.professor_id.slice(0, 8)}
                </p>
                <p className="mt-1 break-all text-xs text-zinc-500">
                  {dict.adminUi.evidence}:{" "}
                  {c.evidence_url ? (
                    <a href={c.evidence_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      {c.evidence_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
                <ActionButtons
                  actions={[
                    {
                      label: dict.adminUi.approve,
                      action: () =>
                        decideClaimAction(c.id, c.professor_id, c.claimant_id, "approved"),
                    },
                    {
                      label: dict.adminUi.reject,
                      action: () =>
                        decideClaimAction(c.id, c.professor_id, c.claimant_id, "rejected"),
                      danger: true,
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Student cards */}
      {(pendingCards ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">
            {dict.adminUi.cardsQueue} ({pendingCards!.length})
          </h2>
          <div className="flex flex-col gap-3">
            {(pendingCards ?? []).map((u) => (
              <CardRow key={u.id} user={u} dict={dict} supabase={supabase} />
            ))}
          </div>
        </section>
      )}

      {/* Reports */}
      {(openReports ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">
            {dict.adminUi.reportsQueue} ({openReports!.length})
          </h2>
          <div className="flex flex-col gap-3">
            {(openReports ?? []).map((rp) => (
              <div
                key={rp.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <p className="text-sm font-medium">{rp.reason}</p>
                {rp.details && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {rp.details}
                  </p>
                )}
                <ActionButtons
                  actions={[
                    {
                      label: dict.adminUi.resolve,
                      action: () => resolveReportAction(rp.id, "resolved"),
                    },
                    {
                      label: dict.adminUi.dismiss,
                      action: () => resolveReportAction(rp.id, "dismissed"),
                      danger: true,
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

async function CardRow({
  user,
  dict,
  supabase,
}: {
  user: { id: string; display_name: string; student_card_url: string | null };
  dict: Awaited<ReturnType<typeof getDictionary>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  let cardUrl: string | null = null;
  if (user.student_card_url) {
    const { data: signed } = await supabase.storage
      .from("student-cards")
      .createSignedUrl(user.student_card_url, 300);
    cardUrl = signed?.signedUrl ?? null;
  }
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <p className="text-sm font-medium">{user.display_name}</p>
      {cardUrl && (
        <a
          href={cardUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {dict.adminUi.cardImage} ↗
        </a>
      )}
      <ActionButtons
        actions={[
          {
            label: dict.adminUi.approve,
            action: () => decideCardAction(user.id, "approve"),
          },
          {
            label: dict.adminUi.reject,
            action: () => decideCardAction(user.id, "reject"),
            danger: true,
          },
        ]}
      />
    </div>
  );
}
