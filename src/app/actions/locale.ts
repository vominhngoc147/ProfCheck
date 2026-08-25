"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, locales } from "@/i18n/config";

export async function setLocaleAction(locale: string): Promise<void> {
  if (!(locales as readonly string[]).includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
}
