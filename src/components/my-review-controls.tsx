"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyReviewAction, updateMyReviewAction } from "@/app/actions/review";

type Dict = {
  edit: string;
  delete: string;
  confirmDelete: string;
  saveEdit: string;
  cancelEdit: string;
};

export function MyReviewControls({
  reviewId,
  content,
  createdAt,
  dict,
}: {
  reviewId: string;
  content: string;
  createdAt: string;
  dict: Dict;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [pending, startTransition] = useTransition();
  const [canEdit] = useState(
    () => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
  );

  if (editing)
    return (
      <div className="mt-3 flex flex-col gap-2">
        <textarea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || value.trim().length < 30}
            onClick={() =>
              startTransition(async () => {
                const res = await updateMyReviewAction(reviewId, value);
                if (res.ok) {
                  setEditing(false);
                  router.refresh();
                }
              })
            }
            className="btn-primary !px-4 !py-1.5 !text-xs"
          >
            {dict.saveEdit}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(content);
            }}
            className="btn-secondary !px-4 !py-1.5 !text-xs"
          >
            {dict.cancelEdit}
          </button>
        </div>
      </div>
    );

  return (
    <div className="mt-3 flex gap-2">
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-secondary !px-4 !py-1.5 !text-xs"
        >
          ✎ {dict.edit}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(dict.confirmDelete)) return;
          startTransition(async () => {
            await deleteMyReviewAction(reviewId);
            router.refresh();
          });
        }}
        className="btn-danger !py-1.5"
      >
        🗑 {dict.delete}
      </button>
    </div>
  );
}
