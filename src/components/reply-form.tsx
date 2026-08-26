"use client";

import { useState, useTransition } from "react";
import { postReplyAction } from "@/app/actions/professor";

export function ReplyForm({
  reviewId,
  initial,
  labels,
}: {
  reviewId: string;
  initial?: string | null;
  labels: { placeholder: string; post: string; posted: string; editReply: string };
}) {
  const [editing, setEditing] = useState(!initial);
  const [saved, setSaved] = useState(!!initial);
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing && saved)
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {labels.editReply}
      </button>
    );

  function submit() {
    startTransition(async () => {
      const res = await postReplyAction(reviewId, value);
      if (res.ok) {
        setSaved(true);
        setEditing(false);
      } else setError(true);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={labels.placeholder}
        className="input !py-2 text-xs"
      />
      {error && <p className="text-xs text-red-500">!</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || value.trim().length === 0}
          className="btn-primary !px-3 !py-1.5 !text-xs"
        >
          {initial ? labels.editReply : labels.post}
        </button>
        {initial && (
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary !px-3 !py-1.5 !text-xs">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
