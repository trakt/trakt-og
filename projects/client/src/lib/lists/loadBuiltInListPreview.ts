import type { PreviewSource } from '../crawl/PreviewSource.ts';
import type { ProfileUser } from '../users/ProfileUser.ts';
import { fetchListPreviewCards } from './fetchListPreviewCards.ts';
import { type BuiltInListKind, toBuiltInListView } from './toBuiltInListView.ts';
import { toListPageSeo } from './toListPageSeo.ts';

type Params = {
  fetch: typeof fetch;
  url: URL;
  kind: BuiltInListKind;
  profile: ProfileUser;
};

/** A member's watchlist or favorites for a link-preview bot: its first page of items is all it reads. */
export async function loadBuiltInListPreview({ fetch, url, kind, profile }: Params): Promise<PreviewSource> {
  const items = await fetchListPreviewCards({ fetch, url, base: `/users/${encodeURIComponent(profile.slug)}/${kind}` });
  const list = toBuiltInListView({
    kind,
    profile,
    id: null,
    commentCount: 0,
    itemCount: items.total,
    sort: { by: 'rank', how: 'asc' },
  });
  return {
    seo: toListPageSeo({ kind, list, profile, cards: items.cards, page: items.page }),
    title: list.name,
    href: list.href,
  };
}
