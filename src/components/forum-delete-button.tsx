"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteForumPostAction } from "@/app/actions/forum";

export function DeleteForumPostButton({
  postId,
  label,
  confirmLabel,
}: {
  postId: string;
  label: string;
  confirmLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(confirmLabel)) return;
    startTransition(async () => {
      const res = await deleteForumPostAction(postId);
      if (res.ok) router.push("/forum");
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={remove}
      className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-60"
    >
      {label}
    </button>
  );
}
