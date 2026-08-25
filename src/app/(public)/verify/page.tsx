import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getDictionary } from "@/i18n";
import { CardUploadForm } from "@/components/card-upload";

export const metadata = { title: "Xác thực tài khoản" };

export default async function VerifyPage() {
  const dict = await getDictionary();
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: full } = await supabase
    .from("profiles")
    .select("verification, student_card_url")
    .eq("id", profile.id)
    .single();

  let cardUrl: string | null = null;
  if (full?.student_card_url) {
    const { data: signed } = await supabase.storage
      .from("student-cards")
      .createSignedUrl(full.student_card_url, 300);
    cardUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">{dict.common.verifyAccount}</h1>

      <div
        className={`mt-6 rounded-xl border p-5 text-sm ${
          full && full.verification !== "none"
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        }`}
      >
        {!full || full.verification === "none" ? (
          <p>{dict.verifyCard.statusNone}</p>
        ) : full.verification === "edu_verified" ? (
          <p>✓ {dict.verifyCard.statusEdu}</p>
        ) : full.verification === "card_verified" ? (
          <p>✓ {dict.verifyCard.statusCardVerified}</p>
        ) : (
          <p>{dict.verifyCard.statusCardPending}</p>
        )}
      </div>

      {full && ["none", "card_pending"].includes(full.verification) && (
        <div className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-700">
          {full.verification === "card_pending" ? (
            <>
              {cardUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cardUrl}
                  alt="Student card"
                  className="mb-3 max-h-56 rounded-lg border border-zinc-200 dark:border-zinc-700"
                />
              )}
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {dict.verifyCard.statusCardPending}
              </p>
            </>
          ) : (
            <CardUploadForm dict={dict.verifyCard} />
          )}
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← {dict.common.home}
      </Link>
    </div>
  );
}
