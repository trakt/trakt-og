import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { yearRange } from '../../shows/toShowEpisodes.ts';
import type { EpisodeChart } from './historyCharts.ts';
import type { HistoryItem } from './historyFilters.ts';
import type { SeasonDetails } from './historyItemBand.ts';
import type { HistoryRow } from './historyRowsSchema.ts';

const episodes = z.array(z.object({ first_aired: z.string().nullish() }));
const seasons = z.array(z.object({ number: z.number(), ids: z.object({ trakt: z.number() }) }));

async function read<T>(fetch: typeof globalThis.fetch, path: string, schema: z.ZodType<T>) {
  const response = await rawApiFetch({ fetch, token: null, path }).catch(() => null);
  if (response?.status !== 200) return undefined;
  return schema.safeParse(await response.json().catch(() => null)).data;
}

/**
 * What the band needs past the first play: a season's air years, from its episodes, or an episode's season id, from its
 * show's seasons, for the season's history link. Either is left out when its read fails.
 */
export async function seasonDetails(
  fetch: typeof globalThis.fetch,
  item: HistoryItem,
  first: HistoryRow | EpisodeChart | undefined,
): Promise<SeasonDetails> {
  if (!first || !('episode' in first)) return {};
  const show = first.show.ids.trakt;
  const number = first.episode.season;
  if (item.type === 'season') {
    const aired = await read(fetch, `/shows/${show}/seasons/${number}?extended=full`, episodes);
    return { years: aired && yearRange(aired.map(({ first_aired }) => first_aired)) };
  }
  if (item.type === 'episode') {
    const all = await read(fetch, `/shows/${show}/seasons`, seasons);
    return { id: all?.find((season) => season.number === number)?.ids.trakt };
  }
  return {};
}
