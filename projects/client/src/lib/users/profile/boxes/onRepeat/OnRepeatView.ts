export type OnRepeatView = {
  /** Times seen, or full runs through a show. */
  readonly times: number;
  readonly image?: string;
  readonly title: { readonly text: string; readonly href: string };
  readonly year?: string;
  /** A movie's last play, "Sep 23"; `null` for a show, which counts full runs instead. */
  readonly last: string | null;
};
