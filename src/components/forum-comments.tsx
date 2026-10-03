"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  addForumCommentAction,
  deleteForumCommentAction,
} from "@/app/actions/forum";
import { ForumVote } from "./forum-vote";

export type ForumCommentItem = {
  id: string;
  parent_id: string | null;
  content: string;
  author_name: string | null;
  author_id: string;
  created_at: string;
  vote_score: number;
  myVote: number | null;
  mine: boolean;
};

type Dict = {
  commentsTitle: string;
  commentPlaceholder: string;
  commentReply: string;
  commentDelete: string;
  confirmDelete: string;
  tooDeep: string;
  needVerified: string;
  submitPost: string;
};

export function ForumComments({
  postId,
  comments,
  canComment,
  loggedIn,
  currentUserId,
  dict,
}: {
  postId: string;
  comments: ForumCommentItem[];
  canComment: boolean;
  loggedIn: boolean;
  currentUserId: string | null;
  dict: Dict;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const childMap = useMemo(() => {
    const m = new Map<string, ForumCommentItem[]>();
    for (const c of comments) {
      if (!c.parent_id) continue;
      if (!m.has(c.parent_id)) m.set(c.parent_id, []);
      m.get(c.parent_id)!.push(c);
    }
    return m;
  }, [comments]);
  const roots = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments]
  );

  function submit() {
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addForumCommentAction(postId, replyTo, text);
      if (res.ok) {
        setText("");
        setReplyTo(null);
        router.refresh();
      } else {
        setError(res.error === "too_deep" ? dict.tooDeep : (res.error ?? "generic"));
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm(dict.confirmDelete)) return;
    startTransition(async () => {
      await deleteForumCommentAction(id, postId);
      router.refresh();
    });
  }

  function renderTree(nodes: ForumCommentItem[], depth: number): ReactNode {
    return nodes.map((n) => (
      <div
        key={n.id}
        className={
          depth > 0
            ? "ml-3 border-l-2 border-zinc-200 pl-3 dark:border-zinc-700"
            : ""
        }
      >
        <div className="flex gap-2 py-2">
          <ForumVote
            targetType="comment"
            targetId={n.id}
            postId={postId}
            score={n.vote_score}
            myVote={n.myVote}
            loggedIn={loggedIn}
            compact
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {n.author_name ?? "?"}
              </span>{" "}
              · {new Date(n.created_at).toLocaleString()}
            </p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-zinc-800 dark:text-zinc-200">
              {n.content}
            </p>
            <div className="mt-1 flex gap-3 text-xs">
              {canComment && depth < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(n.id);
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-indigo-500"
                >
                  {dict.commentReply}
                </button>
              )}
              {(n.mine || (currentUserId !== null && n.author_id === currentUserId)) && (
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  {dict.commentDelete}
                </button>
              )}
            </div>
            {replyTo === n.id && canComment && (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  maxLength={5000}
                  placeholder={dict.commentPlaceholder}
                  className="input resize-y !py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending || !text.trim()}
                    onClick={submit}
                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {dict.submitPost}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(null);
                      setText("");
                    }}
                    className="text-xs text-zinc-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            {renderTree(childMap.get(n.id) ?? [], depth + 1)}
          </div>
        </div>
      </div>
    ));
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold">
        {dict.commentsTitle} ({comments.length})
      </p>
      {renderTree(roots, 0)}
      {error && replyTo === null && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
      {canComment && replyTo === null ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder={dict.commentPlaceholder}
            className="input resize-y text-sm"
          />
          <button
            type="button"
            disabled={pending || !text.trim()}
            onClick={submit}
            className="self-start rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {dict.submitPost}
          </button>
        </div>
      ) : (
        !canComment && (
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            {dict.needVerified}
          </p>
        )
      )}
    </div>
  );
}
