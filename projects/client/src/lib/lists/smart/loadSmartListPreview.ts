import { error } from '@sveltejs/kit';
import { api } from '../../api/api.ts';
import { assertOk } from '../../api/assertOk.ts';
import type { PreviewSource } from '../../crawl/PreviewSource.ts';
import { fetchListSummary } from '../fetchListSummary.ts';
import { toSmartList } from './toSmartList.ts';
import { toSmartListSeo } from './toSmartListSeo.ts';

type Params = { fetch: typeof fetch; id: string; slug: string };

/** A smart list's head for a link-preview bot, from its definition alone. One a signed-out visitor can't see is a 404. */
export async function loadSmartListPreview({ fetch, id, slug }: Params): Promise<PreviewSource> {
  const summary = await fetchListSummary(() =>
    api({ fetch }).users.smartLists.smartList.summary({ params: { id, list_id: slug } }),
  );
  if (!summary || [204, 401, 403, 404].includes(summary.status)) error(404, 'Smart list not found');
  assertOk(summary, 'Smart list');

  const list = toSmartList(summary.body);
  return { seo: toSmartListSeo(list), title: list.name, href: `/users/${id}/smart-lists/${list.slug}` };
}
