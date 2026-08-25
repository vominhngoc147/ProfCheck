export function StarRating({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-base", md: "text-xl", lg: "text-3xl" };
  return (
    <span className={`inline-flex ${sizes[size]} leading-none`} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ScoreBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{value}</span>
      <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}
