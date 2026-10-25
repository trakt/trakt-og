import { api } from '../../../lib/api/api.ts';

/** Real trending shows, so the cards carry real posters. Public, so it goes without the token. */
export async function load({ fetch }) {
  const response = await api({ fetch }).shows.trending({
    query: { extended: 'full,images', limit: 6 },
  });

  return { trending: response.status === 200 ? response.body : [] };
}
