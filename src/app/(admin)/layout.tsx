import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-zinc-200 bg-zinc-950 px-4 py-3 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/admin" className="font-bold text-white">
            ProfCheck Admin
          </Link>
          <Link href="/" className="text-sm text-zinc-300 hover:text-white">
            ← Trang công khai
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
