/**
 * What the related band compares its picks against: the summary title's subgenres and people (Trakt ids). Its first
 * genre's slug picks popular titles in its place when nothing is related.
 */
export type RelatedSource = {
  readonly subgenres: readonly string[];
  readonly people: readonly number[];
  readonly genre?: string;
};
