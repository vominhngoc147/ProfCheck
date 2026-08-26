import Link from "next/link";
import { StarRating } from "./star-rating";

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
];

export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" | "xl" }) {
  const sizes = {
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-20 w-20 text-2xl",
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizes[size]} ${avatarColor(name)}`}
    >
      {name.split(" ").slice(-1)[0]?.charAt(0).toUpperCase()}
    </span>
  );
}

export type ProfessorCardData = {
  id: string;
  slug: string;
  full_name: string;
  academic_title: string | null;
  source_status: string;
  review_count: number;
  avg_overall: number | null;
  avg_difficulty: number | null;
  faculty_name?: string | null;
};

export function ProfessorCard({
  professor,
  facultyName,
}: {
  professor: ProfessorCardData;
  facultyName?: string | null;
}) {
  return (
    <Link
      href={`/professors/${professor.slug}`}
      className="card flex items-center justify-between gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={professor.full_name} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
            {professor.academic_title ? `${professor.academic_title}. ` : ""}
            {professor.full_name}
          </p>
          {(facultyName ?? professor.faculty_name) && (
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
              {facultyName ?? professor.faculty_name}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <StarRating value={professor.avg_overall ?? 0} />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {professor.review_count > 0
            ? `${(professor.avg_overall ?? 0).toFixed(1)} · ${professor.review_count}`
            : "—"}
        </p>
      </div>
    </Link>
  );
}
