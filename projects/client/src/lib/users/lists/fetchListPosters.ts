import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { imageUrl } from '../../utils/imageUrl.ts';

const listImagesSchema = z.object({ images: z.object({ posters: z.array(z.string()).nullish() }).nullish() });

/**
 * A list's first five posters, as its row shows them. `/users/:id/likes/lists` answers with empty posters, so the
 * liked lists read them one list at a time as their rows near the viewport. Anything but a clean answer is no posters:
 * they're decoration, and a failure shouldn't break the row.
 */
export async function fetchListPosters({ fetch, listId }: { fetch: typeof globalThis.fetch; listId: number }) {
  const response = await rawApiFetch({ fetch, path: `/lists/${listId}?extended=images` }).catch(() => null);
  if (response?.status !== 200) return [];
  const parsed = listImagesSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) return [];
  return (parsed.data.images?.posters ?? []).slice(0, 5).map((path) => ({ image: imageUrl(path, 'thumb') }));
}
