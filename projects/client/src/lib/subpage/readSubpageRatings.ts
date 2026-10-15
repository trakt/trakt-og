import { error } from '@sveltejs/kit';
import { ratingsResponseSchema } from '@trakt/api';
import { api } from '../api/api.ts';
import { contractSchema } from '../api/contractSchema.ts';
import { letterboxdSchema } from '../stats/letterboxdSchema.ts';
import { mediaStatsSchema } from '../stats/mediaStatsSchema.ts';
import type { SubpageItem } from './SubpageItem.ts';

function number(value: string, name: string) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) error(404, `${name} not found`);
  return Number(value);
}

function parsed<T>(
  response: { status: number; body: unknown },
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T } },
) {
  if (response.status !== 200) return undefined;
  const result = contractSchema(schema).safeParse(response.body);
  return result.success ? result.data : undefined;
}

async function read(fetch: typeof globalThis.fetch, item: SubpageItem) {
  const client = api({ fetch });
  const { id } = item;
  if (item.type === 'movie' || item.type === 'show') {
    const requests = item.type === 'movie' ? client.movies : client.shows;
    const [ratings, stats] = await Promise.all([
      requests.ratings({ params: { id }, query: { extended: 'all' } }),
      requests.stats({ params: { id } }),
    ]);
    return { ratings, stats };
  }
  const season = number(item.season, 'Season');
  if (item.type === 'season') {
    const [ratings, stats] = await Promise.all([
      client.shows.season.ratings({ params: { id, season }, query: {} }),
      client.shows.season.stats({ params: { id, season } }),
    ]);
    return { ratings, stats };
  }
  const episode = number(item.episode, 'Episode');
  const [ratings, stats] = await Promise.all([
    client.shows.episode.ratings({ params: { id, season, episode }, query: { extended: 'all' } }),
    client.shows.episode.stats({ params: { id, season, episode } }),
  ]);
  return { ratings, stats };
}

/**
 * An item's public ratings (other sites included, Letterboxd for movies) and community counts, for the ratings strip
 * every item subpage carries and the stats page's sections. Null when either read fails or doesn't parse, so a
 * subpage can go without its strip.
 */
export async function readSubpageRatings(fetch: typeof globalThis.fetch, item: SubpageItem) {
  const reads = await read(fetch, item);
  const ratings = parsed(reads.ratings, ratingsResponseSchema);
  const stats = parsed(reads.stats, mediaStatsSchema);
  if (!ratings || !stats) return null;
  const letterboxd = item.type === 'movie' ? letterboxdSchema.safeParse(reads.ratings.body).data?.letterboxd : null;
  return { ratings, stats, letterboxd };
}
