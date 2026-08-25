import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Admin" };

async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string, filters?: Record<string, string>) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [col, val] of Object.entries(filters ?? {})) q = q.eq(col, val);
  const { count: n } = await q;
  return n ?? 0;
}

export default async function AdminPage() {
  await requireRole("moderator", "admin");
  const supabase = await createClient();

  const [pendingReviews, pendingClaims, userCreatedProfs, openReports] =
    await Promise.all([
      count(supabase, "reviews", { status: "pending" }),
      count(supabase, "professor_claims", { status: "pending" }),
      count(supabase, "professors", { source_status: "user_created" }),
      count(supabase, "reports", { status: "open" }),
    ]);

  const queues = [
    { label: "Review chờ duyệt", value: pendingReviews },
    { label: "Claim GV chờ duyệt", value: pendingClaims },
    { label: "Hồ sơ GV tự tạo", value: userCreatedProfs },
    { label: "Report đang mở", value: openReports },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Xử lý hàng đợi kiểm duyệt — UI chi tiết sẽ được xây ở bước tiếp theo.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {queues.map((q) => (
          <div
            key={q.label}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"
          >
            <p className="text-3xl font-bold">{q.value}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {q.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
