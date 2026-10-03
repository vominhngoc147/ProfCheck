// Instant feedback on every navigation: Next.js renders this
// while the target Server Component is still fetching data.
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-10" aria-busy="true">
      <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-4 w-72 rounded bg-zinc-100 dark:bg-zinc-800/70" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1">
                <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800/70" />
              </div>
            </div>
            <div className="mt-3 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
            <div className="mt-2 h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
