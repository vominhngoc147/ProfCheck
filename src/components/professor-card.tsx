import Link from "next/link";
import { StarRating } from "./star-rating";

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

export function ProfessorCard({ professor, facultyName }: { professor: ProfessorCardData; facultyName?: string | null }) {
  return (
    <Link
      href={`/professors/${professor.slug}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 transition-shadow hover:shadow-md dark:border-zinc-700"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
          {professor.academic_title ? `${professor.academic_title} ` : ""}
          {professor.full_name}
          {professor.source_status === "user_created" && (
            <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              ⏳
            </span>
          )}
        </p>
        {(facultyName ?? professor.faculty_name) && (
          <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {facultyName ?? professor.faculty_name}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <StarRating value={professor.avg_overall ?? 0} />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {professor.review_count > 0
            ? `${professor.avg_overall?.toFixed(1)} · ${professor.review_count}`
            : "–"}
        </p>
      </div>
    </Link>
  );
}
