import { toListSeo } from '../seo/pages/toListSeo.ts';
import type { SeoMeta } from '../seo/SeoMeta.ts';
import type { ProfileUser } from '../users/ProfileUser.ts';
import { listPreviewArt } from './listPreviewArt.ts';
import type { ListItemCard } from './toListItemCard.ts';
import type { ListView } from './toListView.ts';

type Params = {
  kind: 'personal' | 'official' | 'watchlist' | 'favorites';
  list: Pick<ListView, 'name' | 'description' | 'href' | 'itemCount' | 'isPublic'>;
  /** The owner, which official lists don't have. */
  profile?: Pick<ProfileUser, 'displayName' | 'isPrivate'>;
  /** The page's items in order: the first one's art goes on the preview, and public lists' first page is indexed. */
  cards: readonly Pick<ListItemCard, 'type' | 'id' | 'href' | 'seasonOf'>[];
  page: number;
};

/**
 * A list page's head: the name, by its owner for a personal list, or "Justin's watchlist". Official lists and public
 * personal lists are in search; the watchlist and favorites follow their route's robots.
 */
export function toListPageSeo({ kind, list, profile, cards, page }: Params): SeoMeta {
  const builtIn = kind === 'watchlist' || kind === 'favorites';
  const indexed = list.isPublic && !profile?.isPrivate && !builtIn;
  return {
    ...toListSeo({
      name: builtIn ? `${profile?.displayName}'s ${kind}` : list.name,
      owner: kind === 'personal' ? profile?.displayName : undefined,
      description: list.description,
      path: list.href,
      itemCount: list.itemCount,
      image: listPreviewArt(cards.at(0)),
      items: indexed && page === 1 ? cards.map(({ href }) => href) : undefined,
    }),
    noindex: !indexed,
  };
}
