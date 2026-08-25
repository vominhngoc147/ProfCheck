import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, type Locale } from "./config";
import vi from "./dictionaries/vi";
import en from "./dictionaries/en";

export type Dictionary = typeof vi;
export { locales, defaultLocale, LOCALE_COOKIE } from "./config";
export type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { vi, en };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : defaultLocale;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}

export function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in params ? String(params[key]) : `{${key}}`
  );
}
