"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createPostAction,
  createTopicAction,
  createTagAction,
  type ForumResult,
} from "@/app/actions/forum";

type ForumDict = {
  createTabPost: string;
  createTabTopic: string;
  createTabTag: string;
  topicLabel: string;
  noTopic: string;
  postTitleLabel: string;
  postTitlePlaceholder: string;
  contentLabel: string;
  contentPlaceholder: string;
  tagsLabel: string;
  tagNameVi: string;
  tagNameEn: string;
  topicTitleLabel: string;
  topicTitlePlaceholder: string;
  topicDescLabel: string;
  topicDescPlaceholder: string;
  submitPost: string;
  submitTopic: string;
  submitTag: string;
  createdPost: string;
  createdTopic: string;
  createdTag: string;
  reupFrom: string;
  reupHint: string;
  reupBlocked: string;
  duplicate: string;
  invalidInput: string;
  viewPost: string;
};

const IDLE: ForumResult = { status: "idle" };

function errorText(code: string, dict: ForumDict): string {
  if (code === "duplicate") return dict.duplicate;
  if (code === "reup_blocked") return dict.reupBlocked;
  if (code === "invalid") return dict.invalidInput;
  return code;
}

export function ForumPostForm({
  topics,
  tags,
  reup,
  dict,
}: {
  topics: { id: string; slug: string; title: string }[];
  tags: { id: string; name_vi: string }[];
  reup: {
    reviewId: string;
    blocked: boolean;
    professorName: string | null;
    professorSlug: string | null;
    rating: number | null;
    excerpt: string;
  } | null;
  dict: ForumDict;
}) {
  const [tab, setTab] = useState<"post" | "topic" | "tag">("post");
  const [postState, postAction, postPending] = useActionState(createPostAction, IDLE);
  const [topicState, topicAction, topicPending] = useActionState(createTopicAction, IDLE);
  const [tagState, tagAction, tagPending] = useActionState(createTagAction, IDLE);

  return (
    <div>
      <div className="mb-5 flex gap-1.5">
        {(
          [
            ["post", dict.createTabPost],
            ["topic", dict.createTabTopic],
            ["tag", dict.createTabTag],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              tab === t
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "post" && (
        <form action={postAction} className="flex flex-col gap-4">
          {reup && <input type="hidden" name="reup_review_id" value={reup.reviewId} />}
          {reup && !reup.blocked && (
            <div className="rounded-xl border border-violet-300 bg-violet-50 p-4 text-sm dark:border-violet-800 dark:bg-violet-950/40">
              <p className="font-semibold text-violet-800 dark:text-violet-200">
                {dict.reupFrom}
                {reup.professorName && reup.professorSlug ? (
                  <Link
                    href={`/professors/${reup.professorSlug}`}
                    className="hover:underline"
                  >
                    {" "}
                    {reup.professorName}
                  </Link>
                ) : (
                  reup.professorName && <> {reup.professorName}</>
                )}
                {reup.rating !== null && <> · ★ {reup.rating}/5</>}
              </p>
              <p className="mt-1 line-clamp-3 text-zinc-600 dark:text-zinc-400">
                “{reup.excerpt}”
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{dict.reupHint}</p>
            </div>
          )}
          {reup?.blocked && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {dict.reupBlocked}
            </p>
          )}
          <div>
            <p className="label">{dict.topicLabel}</p>
            <select name="topic_id" defaultValue="" className="input">
              <option value="">{dict.noTopic}</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="label">{dict.postTitleLabel}</p>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={200}
              placeholder={dict.postTitlePlaceholder}
              className="input"
            />
          </div>
          <div>
            <p className="label">{dict.contentLabel}</p>
            <textarea
              name="content"
              rows={8}
              required
              maxLength={10000}
              placeholder={dict.contentPlaceholder}
              className="input resize-y"
            />
          </div>
          {postState.status === "error" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorText(postState.error, dict)}
            </p>
          )}
          {postState.status === "created" && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {dict.createdPost}{" "}
              <Link href={`/forum/post/${postState.id}`} className="font-semibold hover:underline">
                {dict.viewPost} →
              </Link>
            </p>
          )}
          <button type="submit" disabled={postPending} className="btn-primary self-start">
            {dict.submitPost}
          </button>
        </form>
      )}

      {tab === "topic" && (
        <form action={topicAction} className="flex flex-col gap-4">
          <div>
            <p className="label">{dict.topicTitleLabel}</p>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={120}
              placeholder={dict.topicTitlePlaceholder}
              className="input"
            />
          </div>
          <div>
            <p className="label">{dict.topicDescLabel}</p>
            <textarea
              name="description"
              rows={4}
              maxLength={2000}
              placeholder={dict.topicDescPlaceholder}
              className="input resize-y"
            />
          </div>
          {tags.length > 0 && (
            <div>
              <p className="label">{dict.tagsLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-600"
                  >
                    <input type="checkbox" name="tag_ids" value={t.id} className="h-3.5 w-3.5" />
                    {t.name_vi}
                  </label>
                ))}
              </div>
            </div>
          )}
          {topicState.status === "error" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorText(topicState.error, dict)}
            </p>
          )}
          {topicState.status === "created" && topicState.slug && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {dict.createdTopic}{" "}
              <Link href={`/forum/${topicState.slug}`} className="font-semibold hover:underline">
                {dict.viewPost} →
              </Link>
            </p>
          )}
          <button type="submit" disabled={topicPending} className="btn-primary self-start">
            {dict.submitTopic}
          </button>
        </form>
      )}

      {tab === "tag" && (
        <form action={tagAction} className="flex max-w-md flex-col gap-4">
          <div>
            <p className="label">{dict.tagNameVi}</p>
            <input type="text" name="name_vi" required minLength={2} maxLength={60} className="input" />
          </div>
          <div>
            <p className="label">{dict.tagNameEn}</p>
            <input type="text" name="name_en" maxLength={60} className="input" />
          </div>
          {tagState.status === "error" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorText(tagState.error, dict)}
            </p>
          )}
          {tagState.status === "created" && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {dict.createdTag}
            </p>
          )}
          <button type="submit" disabled={tagPending} className="btn-primary self-start">
            {dict.submitTag}
          </button>
        </form>
      )}
    </div>
  );
}
