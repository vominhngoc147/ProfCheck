import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary, getLocale, interpolate } from "@/i18n";
import { LocaleSwitcher } from "./locale-switcher";
import { signOutAction } from "@/app/actions/auth";

export async function Header() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const supabase = await createClient();
  const [
    { data: { user } },
    profile,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getCurrentProfile(),
  ]);

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">P</span>
          {dict.common.appName}
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          {user ? (
            <>
              {profile?.role === "professor" && (
                <Link
                  href="/prof"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  {dict.profDash.title}
                </Link>
              )}
              <span className="hidden max-w-[160px] truncate text-sm text-zinc-600 sm:inline dark:text-zinc-400">
                {user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  {dict.common.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {interpolate(dict.common.login, {})}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {dict.common.signup}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer({
  disclaimer,
  professorLinkLabel,
}: {
  disclaimer: string;
  professorLinkLabel: string;
}) {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <p className="mx-auto max-w-2xl px-4">{disclaimer}</p>
      <div className="mt-2 flex items-center justify-center gap-4">
        <span className="font-medium">{`© ${new Date().getFullYear()} ProfCheck`}</span>
        <Link href="/join/professor" className="hover:underline">
          {professorLinkLabel}
        </Link>
      </div>
    </footer>
  );
}
