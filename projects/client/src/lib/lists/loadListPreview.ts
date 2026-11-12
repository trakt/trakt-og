import { error } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import type { ProfileUser } from '../users/ProfileUser.ts';
import { fetchListPreviewCards } from './fetchListPreviewCards.ts';
import { fetchListSummary } from './fetchListSummary.ts';
import { toListPageSeo } from './toListPageSeo.ts';
import { toListView } from './toListView.ts';

type Params = {
  fetch: typeof fetch;
  url: URL;
  id: string;
  list: string;
  profile: ProfileUser;
};

/**
 * A personal list's head for a link-preview bot: its summary and its first page of items, for the art. A list a
 * signed-out visitor can't see is a 404, the way crawlers get it.
 */
export async function loadListPreview({ fetch, url, id, list: slug, profile }: Params): Promise<PreviewSource> {
  const [summary, items] = await Promise.all([
    fetchListSummary(() => api({ fetch }).users.lists.list.summary({ params: { id, list_id: slug } })),
    fetchListPreviewCards({
      fetch,
      url,
      base: `/users/${encodeURIComponent(id)}/lists/${encodeURIComponent(slug)}/items`,
    }),
  ]);
  if (!summary || [204, 401, 403, 404].includes(summary.status)) error(404, 'Page Not Found');
  if (summary.status !== 200) error(502, 'Trakt is having trouble loading this list.');

  const list = toListView(summary.body);
  return {
    seo: toListPageSeo({ kind: 'personal', list, profile, cards: items.cards, page: items.page }),
    title: list.name,
    href: list.href,
  };
}
