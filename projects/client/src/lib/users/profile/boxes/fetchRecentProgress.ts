import { z } from 'zod/v4';
import { rawApiFetch } from '../../../api/rawApiFetch.ts';
import type { boxExtraLoader } from './boxExtraLoader.ts';

const recentProgressSchema = z.array(z.object({
  show: z.object({ ids: z.object({ trakt: z.number(), slug: z.string() }), title: z.string() }),
  progress: z.object({
    aired: z.number(),
    completed: z.number(),
    last_watched_at: z.string().nullish(),
  }),
}));

/**
 * `/users/:id/progress/watched/added/desc?limit=10`: the ten shows the user watched most recently, newest first, each
 * with its aired and watched episode counts. `@trakt/api` has no contract for it, so it's parsed here. Anything but a
 * good 200 is no rows.
 */
export async function fetchRecentProgress({ fetch, token, id }: Parameters<typeof boxExtraLoader>[0]) {
  const response = await rawApiFetch({
    fetch,
    token,
    path: `/users/${encodeURIComponent(id)}/progress/watched/added/desc?limit=10`,
  });
  if (response.status !== 200) return [];
  const rows = recentProgressSchema.safeParse(await response.json().catch(() => null));
  return rows.success ? rows.data : [];
}
