import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { SubpageItem } from '../subpage/SubpageItem.ts';
import type { QualityRead } from './QualityRead.ts';
import { qualityEpisodesSchema } from './qualityEpisodesSchema.ts';
import { qualitySeasonsSchema } from './qualitySeasonsSchema.ts';

type Params = { fetch: typeof globalThis.fetch; item: SubpageItem };

async function body(fetch: typeof globalThis.fetch, path: string) {
  const response = await rawApiFetch({ fetch, path });
  return response.status === 200 ? response.json() : null;
}

/**
 * A show's seasons or a season's episodes with their ratings, public and without the token, for the Quality chart.
 * It resolves to null for any other item and for a failed or unparsable read, and never rejects, so the chart's
 * section is just absent and a read dropped by a redirect leaves nothing unhandled.
 */
export async function readQuality({ fetch, item }: Params): Promise<QualityRead | null> {
  try {
    if (item.type === 'show') {
      const seasons = qualitySeasonsSchema.safeParse(
        await body(fetch, `/shows/${encodeURIComponent(item.id)}/seasons?extended=full`),
      );
      return seasons.success ? { type: 'show', seasons: seasons.data } : null;
    }
    if (item.type !== 'season' || !/^\d+$/.test(item.season)) return null;
    const episodes = qualityEpisodesSchema.safeParse(
      await body(fetch, `/shows/${encodeURIComponent(item.id)}/seasons/${item.season}?extended=full`),
    );
    return episodes.success ? { type: 'season', season: Number(item.season), episodes: episodes.data } : null;
  } catch {
    return null;
  }
}
