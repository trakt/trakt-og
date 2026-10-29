import type { ListKind } from './listTypeOptions.ts';

type ListProgressHrefParams = {
  list: { readonly id: number | null; readonly kind: ListKind; readonly ownerSlug: string };
  viewerSlug: string;
};

/**
 * "View watched progress" for a list: the viewer's progress narrowed to its shows. A personal list goes by its id, as
 * on OG; the watchlist and favorites go by owner, since `/lists/:id/items` only reads personal and official lists.
 * Undefined on official lists, as on OG, and on a personal list without its id.
 */
export function listProgressHref({ list, viewerSlug }: ListProgressHrefParams): string | undefined {
  if (list.kind === 'official') return undefined;
  if (list.kind === 'watchlist' || list.kind === 'favorites') {
    return `/users/${viewerSlug}/progress?list=${list.ownerSlug}/${list.kind}`;
  }
  return list.id !== null && list.id > 0 ? `/users/${viewerSlug}/progress?list=${list.id}` : undefined;
}
