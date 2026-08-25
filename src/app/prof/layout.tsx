import Link from "next/link";
import { getOwnedProfessor } from "@/lib/auth";
import { getDictionary } from "@/i18n";

export const metadata = { title: "Trang giảng viên" };

export default async function ProfLayout({
  children,
}: LayoutProps<"/prof">) {
  const { professor } = await getOwnedProfessor();
  const dict = await getDictionary();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{dict.profDash.title}</h1>
        {professor && (
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/prof"
              className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {dict.profDash.navOverview}
            </Link>
            <Link
              href="/prof/profile"
              className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {dict.profDash.editProfile}
            </Link>
            <Link
              href="/prof/slots"
              className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {dict.profDash.manageSlots}
            </Link>
          </nav>
        )}
      </div>
      {!professor ? (
        <div className="rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-300">
            {dict.profDash.noProfessor}
          </p>
          <Link
            href="/join/professor"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {dict.profDash.noProfessorCta}
          </Link>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
