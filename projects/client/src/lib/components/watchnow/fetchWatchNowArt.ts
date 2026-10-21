import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { imageUrl } from '../../utils/imageUrl.ts';

const imagesSchema = z.object({ images: z.object({ fanart: z.array(z.string()).nullish() }).nullish() });

/** The fanart of the movie or show a Watch Now path belongs to (a season's or episode's is its show's). */
export async function fetchWatchNowArt(path: string, fetch = globalThis.fetch): Promise<string | undefined> {
  const item = path.match(/^\/(movies|shows)\/[^/]+/)?.[0];
  if (!item) return undefined;
  const response = await rawApiFetch({ fetch, path: `${item}?extended=images` }).catch(() => null);
  if (!response?.ok) return undefined;
  const parsed = imagesSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? imageUrl(parsed.data.images?.fanart?.at(0), 'medium') : undefined;
}
