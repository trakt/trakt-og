import { error } from '@sveltejs/kit';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { fetchListPreviewCards } from './fetchListPreviewCards.ts';
import { fetchOfficialListSummary } from './fetchOfficialListSummary.ts';
import { toListPageSeo } from './toListPageSeo.ts';
import { toListView } from './toListView.ts';

type Params = { fetch: typeof fetch; url: URL; slug: string };

/** An official list's head for a link-preview bot: its summary and its first page of items, for the art. */
export async function loadOfficialListPreview({ fetch, url, slug }: Params): Promise<PreviewSource> {
  const summary = await fetchOfficialListSummary({ fetch, id: slug });
  if (!summary || [204, 401, 403, 404].includes(summary.status)) error(404, 'Page Not Found');
  if (summary.status !== 200) error(502, 'Trakt is having trouble loading this list.');
  if (summary.body.type !== 'official') error(404, 'Page Not Found');

  const list = toListView(summary.body);
  const items = await fetchListPreviewCards({ fetch, url, base: `/lists/${list.id}/items` });
  return {
    seo: toListPageSeo({ kind: 'official', list, cards: items.cards, page: items.page }),
    title: list.name,
    href: list.href,
  };
}
