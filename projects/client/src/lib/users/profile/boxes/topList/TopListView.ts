export type TopListView = {
  /** "1,840". */
  readonly likes: string;
  /** "23 lists". */
  readonly lists: string;
  /** The most liked list's first three posters. */
  readonly posters: readonly string[];
  readonly title: { readonly text: string; readonly href: string };
  /** "1,204 likes · 87 items · 64 comments". */
  readonly line: string;
};
