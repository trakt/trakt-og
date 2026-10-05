export type OnRepeatView = {
  /** Times seen, or full runs through a show. */
  readonly times: number;
  readonly image?: string;
  readonly title: { readonly text: string; readonly href: string };
  /** "Seen 9 times · last on Sep 23", or "3 full runs · and counting". */
  readonly line: string;
  /** "+22 more rewatched", or `null` with none. */
  readonly others: string | null;
};
