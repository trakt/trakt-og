import { redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { assertListFound } from './assertListFound.ts';
import { fetchListSummary } from './fetchListSummary.ts';
import { listPath } from './listPath.ts';

type RedirectToListParams = {
  fetch: typeof globalThis.fetch;
  locals: { token: string | null };
  params: { id: string };
};

function readList(fetch: typeof globalThis.fetch, id: string, token: string | null) {
  return fetchListSummary(() => api({ fetch, token }).lists.summary({ params: { id } }));
}

/**
 * `/lists/:id`, `/watchlist/:id` and `/officiallist/:id`: a 301 to the list's own page.
 * A list the viewer can't see is a 404. The public read goes first; the token only for a list it didn't find.
 */
export async function redirectToList({ fetch, locals, params }: RedirectToListParams): Promise<never> {
  const anonymous = await readList(fetch, params.id, null);
  const response = anonymous?.status !== 200 && locals.token
    ? await readList(fetch, params.id, locals.token)
    : anonymous;
  assertListFound(response);
  redirect(301, listPath(response.body));
}
