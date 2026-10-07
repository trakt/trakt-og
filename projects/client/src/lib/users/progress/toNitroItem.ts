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
 * One show from `/sync/progress/up_next_nitro`, as a progress row's data: the API counts the aired and completed
 * episodes (since a rewatch's reset), the plays and the minutes, and names the next and the last watched episodes, so
 * nothing here needs the show's catalog. Without stats, the plays fall back to the completed count and the minutes to
 * the show's runtime.
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
