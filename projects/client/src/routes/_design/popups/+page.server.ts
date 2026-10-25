import { api } from '../../../lib/api/api.ts';
import { imageUrl } from '../../../lib/utils/imageUrl.ts';

/** Fight Club's real fanart, for the art dialogs' headers. Public, so it goes without the token. */
export async function load({ fetch }) {
  const response = await api({ fetch }).movies.summary({
    params: { id: 'fight-club-1999' },
    query: { extended: 'full,images' },
  });

  return { fanart: response.status === 200 ? imageUrl(response.body.images?.fanart?.at(0), 'medium') : undefined };
}
