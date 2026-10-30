export type ProgressSeason = Readonly<{
  number: number;
  episodes: readonly Readonly<{ number: number; completed: boolean }>[];
}>;
export type EpisodeNumber = Readonly<{ season: number; number: number }>;
export type UpTo = Readonly<{
  /** Earlier unwatched episodes in broadcast order, ending with the picked one. */
  episodes: readonly EpisodeNumber[];
  /** Earlier episodes already watched, left alone so none becomes a rewatch. */
  skipped: number;
}>;

/**
 * What "Up to here" adds for an episode: every aired, unwatched episode before it, then the episode itself. Specials
 * count only when the episode is a special. Progress lists aired episodes only, so nothing unreleased is added.
 */
export function episodesUpTo({
  seasons,
  episode,
}: {
  seasons: readonly ProgressSeason[];
  episode: EpisodeNumber;
}): UpTo {
  const special = episode.season === 0;
  const earlier = seasons
    .filter(({ number }) => (special ? number === 0 : number > 0 && number <= episode.season))
    .toSorted((a, b) => a.number - b.number)
    .flatMap((season) =>
      season.episodes
        .filter(({ number }) => season.number < episode.season || number < episode.number)
        .toSorted((a, b) => a.number - b.number)
        .map(({ number, completed }) => ({ season: season.number, number, completed })),
    );
  return {
    episodes: [
      ...earlier.filter(({ completed }) => !completed).map(({ season, number }) => ({ season, number })),
      { season: episode.season, number: episode.number },
    ],
    skipped: earlier.filter(({ completed }) => completed).length,
  };
}
