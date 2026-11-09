/** A movie on a franchise, with a release date. */
export type FranchiseMovie = {
  readonly id: number;
  readonly title: string;
  readonly year?: number;
  readonly href: string;
  readonly poster?: string;
  readonly fanart?: string;
  /** The Trakt rating, 0 to 10. */
  readonly rating?: number;
  /** The release date, `YYYY-MM-DD`. */
  readonly released: string;
  /** Minutes. */
  readonly runtime: number;
};
