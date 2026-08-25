"use client";

import { useActionState } from "react";
import { createOpportunityAction } from "@/app/actions/professor";

type SlotsDict = {
  newOpportunity: string;
  oppType: string;
  typeNckh: string;
  typeKltn: string;
  typeLuanVan: string;
  typeThucTap: string;
  typeKhac: string;
  oppTitle: string;
  oppDesc: string;
  oppTags: string;
  oppSlots: string;
  oppDeadline: string;
  invalidInput: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600";

export function NewOpportunityForm({ dict }: { dict: SlotsDict }) {
  const [state, formAction, pending] = useActionState(
    createOpportunityAction,
    { status: "idle" } as
      | { status: "idle" }
      | { status: "error"; error: string }
      | { status: "opp_created" }
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="type" className={inputClass} defaultValue="nckh">
          <option value="nckh">{dict.typeNckh}</option>
          <option value="kltn">{dict.typeKltn}</option>
          <option value="luan_van">{dict.typeLuanVan}</option>
          <option value="thuc_tap">{dict.typeThucTap}</option>
          <option value="khac">{dict.typeKhac}</option>
        </select>
        <input type="text" name="title" required placeholder={dict.oppTitle} className={inputClass} />
      </div>
      <textarea name="description" rows={3} placeholder={dict.oppDesc} className={inputClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input type="text" name="tags" placeholder={dict.oppTags} className={inputClass} />
        <input
          type="number"
          name="slots_total"
          min={1}
          defaultValue={1}
          placeholder={dict.oppSlots}
          className={inputClass}
        />
        <input type="date" name="deadline" className={inputClass} />
      </div>
      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {dict.invalidInput}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        + {dict.newOpportunity}
      </button>
    </form>
  );
}
