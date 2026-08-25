"use client";

import { useTransition } from "react";
import {
  setOpportunityStatusAction,
  deleteOpportunityAction,
} from "@/app/actions/professor";

export function OpportunityActions({
  id,
  isOpen,
  labels,
}: {
  id: string;
  isOpen: boolean;
  labels: { close: string; reopen: string; del: string };
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            setOpportunityStatusAction(id, isOpen ? "closed" : "open")
          )
        }
        className="rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        {isOpen ? labels.close : labels.reopen}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this opportunity?"))
            startTransition(() => deleteOpportunityAction(id));
        }}
        className="rounded-full border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        {labels.del}
      </button>
    </div>
  );
}
