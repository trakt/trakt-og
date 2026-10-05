import { z } from 'zod/v4';
import { rawApiFetch } from '../../../api/rawApiFetch.ts';
import type { boxExtraLoader } from './boxExtraLoader.ts';

const userListsSchema = z.array(z.object({
  name: z.string(),
  ids: z.object({ slug: z.string() }),
  likes: z.number(),
  item_count: z.number(),
  comment_count: z.number(),
  updated_at: z.string(),
  images: z.object({ posters: z.array(z.string()).nullish() }).nullish(),
}));

/**
 * `/users/:id/lists?extended=images`: the user's lists with likes, sizes and a few posters each, unpaged. Parsed here
 * so the box reads exactly these fields; anything but a good 200 is no lists.
 */
export async function fetchUserLists({ fetch, token, id }: Parameters<typeof boxExtraLoader>[0]) {
  const response = await rawApiFetch({ fetch, token, path: `/users/${encodeURIComponent(id)}/lists?extended=images` });
  if (response.status !== 200) return [];
  const rows = userListsSchema.safeParse(await response.json().catch(() => null));
  return rows.success ? rows.data : [];
}
