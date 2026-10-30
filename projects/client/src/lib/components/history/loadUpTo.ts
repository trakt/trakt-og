import { api } from '../../api/api.ts';
import type { WatchEpisode } from './WatchEpisode.ts';
import { type EpisodeNumber, episodesUpTo, type UpTo } from './episodesUpTo.ts';

type Episode = { show: number; season: number; number: number };

/** What "Up to here" would add for an episode, from the viewer's progress. Undefined when nothing before it is unwatched. */
export async function loadUpTo({
  episode,
  fetch,
}: {
  episode: Episode;
  fetch: typeof globalThis.fetch;
}): Promise<UpTo | undefined> {
  const response = await api({ fetch }).shows.progress.watched({
    params: { id: String(episode.show) },
    query: { hidden: true, specials: episode.season === 0 },
  });
  if (response.status !== 200) throw new Error(String(response.status));
  const upTo = episodesUpTo({ seasons: response.body.seasons, episode });
  return upTo.episodes.length > 1 ? upTo : undefined;
}

/** The overlay ids for those episodes, from the public season summaries. */
export async function upToEpisodes({
  show,
  episodes,
}: {
  show: number;
  episodes: readonly EpisodeNumber[];
}): Promise<WatchEpisode[]> {
  const seasons = [...new Set(episodes.map(({ season }) => season))];
  const ids = new Map(
    (
      await Promise.all(
        seasons.map(async (season) => {
          const details = await api().shows.season.episodes({ params: { id: String(show), season }, query: {} });
          if (details.status !== 200) throw new Error(String(details.status));
          return details.body.map(({ number, ids }) => [`${season}x${number}`, ids.trakt] as const);
        }),
      )
    ).flat(),
  );
  return episodes.map(({ season, number }) => {
    const id = ids.get(`${season}x${number}`);
    if (id === undefined) throw new Error('Episode not found');
    return { id, show, season, number, completed: false };
  });
}
