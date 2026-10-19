import type { ListRowActions } from '../components/media/ListRowActions.ts';
import { traktUrls } from '../traktUrls.ts';
import type { SummaryList } from '../summary/toSummaryList.ts';

/** What the icons read off a row: a summary's, a lists page's or a search result's. */
export type ActionList = Pick<SummaryList, 'id' | 'kind' | 'href'> & { readonly owner: { readonly slug: string } };

type Params = {
  list: ActionList;
  /** The signed-in viewer, or null. */
  viewer: { readonly slug: string; readonly isVip: boolean } | null;
  /** og's origin, for the share URL. */
  origin: string;
};

/**
 * The icons a row on an item's lists page shows: the report flag when signed in,
 * the owner's edit and (personal lists only) delete, progress (not on official lists) and share. The page wires edit
 * and delete; the row opens the report dialog itself. The calendar icon is cut, and the
 * collaborator's "Stop collaborating" needs a collaborators read per row, which this page leaves out.
 */
export function itemListRowActions({ list, viewer, origin }: Params): ListRowActions {
  const owner = viewer !== null && viewer.slug === list.owner.slug;
  const progressHref = viewer?.isVip ? `/users/${viewer.slug}/progress?list=${list.id}` : traktUrls.vip;

  return {
    ...(viewer && { report: {} }),
    ...(owner && list.kind !== 'official' && { edit: {} }),
    ...(owner && list.kind === 'personal' && { delete: {} }),
    ...(list.kind !== 'official' && { progressHref }),
    shareUrl: `${origin}${list.href}`,
  };
}
