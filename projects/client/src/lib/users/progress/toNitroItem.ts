import type { UpNextResponse } from '@trakt/api';
import type { CatalogEpisode } from '../../shows/cache/ShowCatalog.ts';
import type { ProgressItem } from './ProgressItem.ts';
import { toProgressShow } from './toProgressShow.ts';

type Episode = NonNullable<UpNextResponse['progress']['next_episode']>;

function toEpisode(episode: Episode | null): CatalogEpisode | undefined {
  if (!episode) return undefined;
  return {
    id: episode.ids.trakt,
    season: episode.season,
    number: episode.number,
    numberAbs: episode.number_abs ?? undefined,
    title: episode.title ?? undefined,
    overview: episode.overview ?? undefined,
    type: episode.episode_type ?? undefined,
    firstAired: episode.first_aired ?? undefined,
    runtime: episode.runtime ?? undefined,
    rating: episode.rating ?? undefined,
    screenshot: episode.images?.screenshot?.at(0),
  };
}

/**
 * One show from `/sync/progress/up_next_nitro`, as a progress row's data: the show, the aired count and the next and
 * last watched episodes. Its watched counts are only a stand-in: `toProgressItems` recounts the watches, plays and
 * times from the overlay, since the endpoint's `completed` can count episodes that were never watched.
 */
export function toNitroItem(item: UpNextResponse, fetchedAt: number): ProgressItem {
  const show = toProgressShow(item.show, fetchedAt);
  const { aired, completed, stats } = item.progress;
  const runtime = show.runtime ?? 0;
  const plays = stats?.play_count ?? completed;

  return {
    show,
    aired,
    completed: Math.min(completed, aired),
    plays,
    minutesWatched: stats?.minutes_watched ?? plays * runtime,
    minutesLeft: stats?.minutes_left ?? Math.max(aired - completed, 0) * runtime,
    exact: stats?.minutes_left !== undefined && stats.minutes_left !== null,
    lastAt: item.progress.last_watched_at ?? undefined,
    next: toEpisode(item.progress.next_episode),
    last: toEpisode(item.progress.last_episode),
  };
}
