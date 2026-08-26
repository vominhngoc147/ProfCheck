"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({
  labels,
}: {
  labels: { sortBy: string; sortReviews: string; sortRating: string; sortName: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "reviews";
  const q = params.get("q");
  const faculty = params.get("faculty");

  function change(sort: string) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (faculty) sp.set("faculty", faculty);
    if (sort !== "reviews") sp.set("sort", sort);
    router.replace(`/search?${sp.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      {labels.sortBy}
      <select
        value={current}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-xs dark:border-zinc-600"
      >
        <option value="reviews">{labels.sortReviews}</option>
        <option value="rating">{labels.sortRating}</option>
        <option value="name">{labels.sortName}</option>
      </select>
    </label>
  );
}
