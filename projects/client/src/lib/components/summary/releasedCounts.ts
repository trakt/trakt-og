/** A count on a summary's ratings strip: "410k watchers". */
export type StripCount = { readonly count: number; readonly label: string; readonly href?: string };

const isLists = ({ label }: StripCount) => label === 'list' || label === 'lists';

/**
 * The counts a title may show. Before release it keeps only its list count: lists are real anticipation, but watchers,
 * plays, libraries, comments and favorites before release can only come from people gaming them, and the API doesn't
 * stop that yet.
 */
export function releasedCounts<T extends StripCount>(counts: readonly T[], released: boolean): readonly T[] {
  return released ? counts : counts.filter(isLists);
}
