/** The API item and its public permalink; nested season/episode URLs still report by their Trakt id. */
export interface ReportTarget {
  readonly type: 'movie' | 'show' | 'season' | 'episode' | 'person' | 'user' | 'comment' | 'list';
  readonly id: number | string;
  /** The dialog's heading: the item's name, or "Comment by" its author. Left blank, it reads "Report comment". */
  readonly title: string;
  /** Beside the title in the dialog header, as on the summary: "Runner 2026". */
  readonly year?: number | null;
  readonly href: string;
  readonly tmdb?: string;
  /** Personal list reports use the owner-scoped route. Other list kinds report by numeric id. */
  readonly ownerSlug?: string;
  /** The header art: an item's fanart, or a profile's cover. */
  readonly fanart?: string;
  /** A list's first posters, for the header when there's no fanart. */
  readonly posters?: readonly string[];
}
