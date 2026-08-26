export const REVIEW_TAG_KEYS = [
  "chamdang",
  "chamkho",
  "dayhay",
  "cotam",
  "nhiettinh",
  "hotroi",
  "nhieubaitap",
  "chamtraloi",
  "danhnghia",
  "huongdan_tot",
  "lamvanhdong",
  "thucte",
] as const;

export type ReviewTagKey = (typeof REVIEW_TAG_KEYS)[number];
