import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { registered, error } = await searchParams;
  const dict = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">{dict.auth.loginTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        {dict.auth.loginSubtitle}
      </p>
      {registered && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {dict.auth.registeredNotice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {dict.auth.callbackError}
        </p>
      )}
      <LoginForm dict={dict.auth} />
    </div>
  );
}
