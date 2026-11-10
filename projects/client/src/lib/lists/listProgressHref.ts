import type { ListKind } from './listTypeOptions.ts';

type ListProgressHrefParams = {
  list: {
    readonly id: number | null;
    readonly kind: ListKind;
    readonly ownerSlug: string;
    /** Known to hold movies and no shows: its progress is the Franchises tab. */
    readonly moviesOnly?: boolean;
    /** The whole list's, unfiltered: an empty list has no progress to show. */
    readonly itemCount?: number;
  };
  viewerSlug: string;
};

/**
 * "View watched progress" for a list: the viewer's progress narrowed to it, its shows by default and its franchises
 * when it's movies only. Personal and official lists go by their id, as personal lists did on OG; the watchlist and
 * favorites go by owner, since `/lists/:id/items` only reads personal and official lists. Undefined on an empty list
 * and on one without its id.
 */
export function listProgressHref({ list, viewerSlug }: ListProgressHrefParams): string | undefined {
  if (list.itemCount === 0) return undefined;
  const key =
    list.kind === 'watchlist' || list.kind === 'favorites'
      ? `${list.ownerSlug}/${list.kind}`
      : list.id !== null && list.id > 0
        ? String(list.id)
        : undefined;
  if (key === undefined) return undefined;
  return `/users/${viewerSlug}/progress${list.moviesOnly ? '/franchises' : ''}?list=${key}`;
}
