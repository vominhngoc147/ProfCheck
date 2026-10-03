"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction, deleteCommentAction } from "@/app/actions/social";

export type CommentItem = {
  id: string;
  content: string;
  is_anonymous: boolean;
  author_name: string | null;
  created_at: string;
  mine: boolean;
};

type Dict = {
  title: string;
  placeholder: string;
  submit: string;
  anonymous: string;
  delete: string;
  confirmDelete: string;
  needVerified: string;
  anonymousAuthor: string;
};

export function ReviewComments({
  reviewId,
  professorSlug,
  comments,
  canComment,
  dict,
}: {
  reviewId: string;
  professorSlug: string;
  comments: CommentItem[];
  canComment: boolean;
  dict: Dict;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await addCommentAction(reviewId, text, anonymous, professorSlug);
      if (res.ok) {
        setText("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm(dict.confirmDelete)) return;
    startTransition(async () => {
      await deleteCommentAction(id, professorSlug);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <p className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        💬 {dict.title} ({comments.length})
      </p>
      <div className="flex flex-col gap-2">
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {c.is_anonymous ? dict.anonymousAuthor : (c.author_name ?? "?")}
              </span>
              <span className="flex items-center gap-2 text-[11px] text-zinc-400">
                {new Date(c.created_at).toLocaleDateString()}
                {c.mine && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(c.id)}
                    className="hover:text-red-500"
                  >
                    {dict.delete}
                  </button>
                )}
              </span>
            </div>
            <p className="mt-0.5 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {c.content}
            </p>
          </div>
        ))}
      </div>
      {canComment ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={dict.placeholder}
            className="input resize-y !py-2 text-sm"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              🕶️ {dict.anonymous}
            </label>
            <button
              type="button"
              disabled={pending || !text.trim()}
              onClick={submit}
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {dict.submit}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {dict.needVerified}
        </p>
      )}
    </div>
  );
}
