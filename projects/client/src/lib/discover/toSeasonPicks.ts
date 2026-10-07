import type { ThemeMedia } from './themeRowsSchema.ts';
import { type PosterItem, toPosterItem } from './toPosterItem.ts';

/** A season pick, and whether it's trending now or one of the all-time favorites. */
export type SeasonPick = PosterItem & { readonly source: 'trending' | 'favorite' };

type ByType = { readonly movie: readonly ThemeMedia[]; readonly show: readonly ThemeMedia[] };

type SeasonPicksParams = {
  /** What's trending with the theme's filters. Out of season this is thin, sometimes empty. */
  trending: ByType;
  /** The all-time favorites with the same filters, so every month has picks. */
  favorites: ByType;
  now: Date;
  limit?: number;
};

/**
 * The season's picks: a trending movie and show, then a favorite movie and show, round by round, without repeats and
 * only with posters. The hero and the season's shelf come from these.
 */
export function toSeasonPicks({ trending, favorites, now, limit = 20 }: SeasonPicksParams): SeasonPick[] {
  const rounds = Math.max(trending.movie.length, trending.show.length, favorites.movie.length, favorites.show.length);
  const candidates = Array.from({ length: rounds }, (_, index) => [
    { type: 'movie' as const, media: trending.movie.at(index), source: 'trending' as const },
    { type: 'show' as const, media: trending.show.at(index), source: 'trending' as const },
    { type: 'movie' as const, media: favorites.movie.at(index), source: 'favorite' as const },
    { type: 'show' as const, media: favorites.show.at(index), source: 'favorite' as const },
  ]).flat().flatMap(({ type, media, source }) => (media ? [{ ...toPosterItem(media, type, now), source }] : []));

  return candidates
    .filter((item, index) => item.poster && candidates.findIndex(({ key }) => key === item.key) === index)
    .slice(0, limit);
}
