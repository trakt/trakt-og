import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { ParentalGuide } from './ParentalGuide.ts';
import { parentalGuideSchema } from './parentalGuideSchema.ts';
import { toParentalGuide } from './toParentalGuide.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  /** The route only answers a signed-in viewer, so a guest has no guide. */
  token: string | null;
  type: 'movie' | 'show';
  /** The title's slug or Trakt id. */
  id: string;
};

/** A title's parental guide. Empty for a guest, a title without one, and a failed or malformed read. */
export async function fetchParentalGuide({ fetch, token, type, id }: Params): Promise<ParentalGuide> {
  if (!token) return [];
  const response = await rawApiFetch({
    fetch,
    token,
    path: `/v3/media/${type}/${id}/info/16/version/1?locale=en`,
  }).catch(() => null);
  if (response?.status !== 200) return [];
  const body = parentalGuideSchema.safeParse(await response.json().catch(() => null));
  return body.success ? toParentalGuide(body.data) : [];
}
