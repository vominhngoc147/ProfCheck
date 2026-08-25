import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n";
import { SignupForm } from "@/components/auth-forms";

export const metadata = { title: "Đăng ký" };

export default async function SignupPage() {
  const dict = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">{dict.auth.signupTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        {dict.auth.signupSubtitle}
      </p>
      <SignupForm dict={dict.auth} />
    </div>
  );
}
