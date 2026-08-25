import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n";

export const metadata = { title: "Xác thực tài khoản" };

export default async function VerifyPage() {
  const dict = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let verification: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification")
      .eq("id", user.id)
      .single();
    verification = profile?.verification ?? null;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{dict.auth.verificationBannerTitle}</h1>
      {verification && verification !== "none" ? (
        <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          ✓ {verification === "edu_verified" ? "edu_verified" : verification} —
          tài khoản đã được xác thực.
        </div>
      ) : (
        <>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {dict.auth.verificationBannerEdu}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {dict.auth.verificationBannerCard}
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        ← {dict.common.home}
      </Link>
    </div>
  );
}
