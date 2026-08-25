"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/locale";
import { locales } from "@/i18n/config";

export function LocaleSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: string) {
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex overflow-hidden rounded-full border border-zinc-300 text-sm dark:border-zinc-600 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          disabled={locale === current}
          className={`px-2.5 py-1 transition-colors ${
            locale === current
              ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
