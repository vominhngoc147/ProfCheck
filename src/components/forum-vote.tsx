"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleForumVoteAction } from "@/app/actions/forum";

export function ForumVote({
  targetType,
  targetId,
  postId,
  score,
  myVote,
  loggedIn,
  compact,
}: {
  targetType: "post" | "comment";
  targetId: string;
  postId: string;
  score: number;
  myVote: number | null;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function vote(value: 1 | -1) {
    if (!loggedIn || pending) return;
    startTransition(async () => {
      await toggleForumVoteAction(targetType, targetId, value, postId);
      router.refresh();
    });
  }

  const btn = `flex items-center justify-center rounded transition-colors disabled:opacity-60 ${
    compact ? "h-6 w-6 text-sm" : "h-7 w-7 text-base"
  }`;
  return (
    <div
      className={`flex ${compact ? "flex-row items-center gap-0.5" : "flex-col items-center gap-0.5"}`}
    >
      <button
        type="button"
        disabled={!loggedIn || pending}
        onClick={() => vote(1)}
        aria-label="upvote"
        className={`${btn} ${
          myVote === 1
            ? "text-orange-500"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-orange-500 dark:hover:bg-zinc-800"
        }`}
      >
        ▲
      </button>
      <span
        className={`font-bold ${compact ? "text-xs" : "text-sm"} ${
          score > 0
            ? "text-orange-500"
            : score < 0
              ? "text-indigo-500"
              : "text-zinc-500"
        }`}
      >
        {score}
      </span>
      <button
        type="button"
        disabled={!loggedIn || pending}
        onClick={() => vote(-1)}
        aria-label="downvote"
        className={`${btn} ${
          myVote === -1
            ? "text-indigo-500"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-indigo-500 dark:hover:bg-zinc-800"
        }`}
      >
        ▼
      </button>
    </div>
  );
}
