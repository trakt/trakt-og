export type TopListView = {
  /** The fanart of the most liked list's first item, like Featured List's. */
  readonly image?: string;
  /** The most liked list's first three posters. */
  readonly posters: readonly string[];
  readonly title: { readonly text: string; readonly href: string };
  /** The list's counts, as a list row shows them. */
  readonly counts: { readonly items: number; readonly likes: number; readonly comments: number };
};
