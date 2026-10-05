import { z } from 'zod/v4';
import { rawApiFetch } from '../../../api/rawApiFetch.ts';
import type { boxExtraLoader } from './boxExtraLoader.ts';

const media = z.object({ title: z.string(), ids: z.object({ slug: z.string() }) });
const latestTenSchema = z.array(z.object({ type: z.string(), movie: media.nullish(), show: media.nullish() }));

/**
 * `/users/:id/ratings/all/10?limit=1`: the newest title rated 10, if it's a movie or show. An episode or season row
 * carries its show too, so the row's `type` decides. `null` when there's none or the request fails.
 */
export async function fetchLatestTen({ fetch, token, id }: Parameters<typeof boxExtraLoader>[0]) {
  const response = await rawApiFetch({ fetch, token, path: `/users/${encodeURIComponent(id)}/ratings/all/10?limit=1` });
  if (response.status !== 200) return null;
  const rows = latestTenSchema.safeParse(await response.json().catch(() => null));
  const row = rows.success ? rows.data.at(0) : undefined;
  if (row?.type === 'movie' && row.movie) return { title: row.movie.title, href: `/movies/${row.movie.ids.slug}` };
  if (row?.type === 'show' && row.show) return { title: row.show.title, href: `/shows/${row.show.ids.slug}` };
  return null;
}
