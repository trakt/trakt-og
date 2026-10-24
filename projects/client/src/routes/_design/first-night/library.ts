import { FIRST_NIGHT_GOAL } from '../../../lib/firstNight/firstNight.ts';
import type { StarterPick } from '../../../lib/firstNight/starterPicks.ts';
import type { OverlaySlices } from '../../../lib/overlay/OverlaySlices.ts';

/** The slices the reel, the getting-started pill and the nudges count from. */
export type DemoLibrary = Pick<OverlaySlices, 'watchedMovies' | 'watchedShows' | 'watchlist' | 'ratings' | 'network'>;

type Title = Pick<StarterPick, 'type' | 'id'>;

/** How far a new member got on the wall, each step a little further toward the first ten. */
export const libraryStages = [
  { id: 'none', label: 'Nothing yet', watched: 0, watchlisted: 0, rated: 0, following: 0 },
  { id: 'one', label: 'One seen', watched: 1, watchlisted: 0, rated: 0, following: 0 },
  { id: 'three', label: 'Three seen', watched: 3, watchlisted: 0, rated: 0, following: 0 },
  { id: 'five', label: 'Five seen and rated', watched: 5, watchlisted: 0, rated: 5, following: 0 },
  { id: 'ten', label: 'Ten tracked, three people followed', watched: 7, watchlisted: 3, rated: 5, following: 3 },
] as const;

export type LibraryStage = (typeof libraryStages)[number];

const WATCHED_AT = '2026-10-20T21:00:00.000Z';

// Made-up titles fill in when the charts didn't load, so the counts still add up.
const padded = (picks: readonly Title[]): readonly Title[] =>
  [...picks, ...Array.from({ length: FIRST_NIGHT_GOAL }, (_, i) => ({ type: 'show' as const, id: 990_000 + i }))]
    .slice(0, FIRST_NIGHT_GOAL);

const ids = (titles: readonly Title[], type: Title['type']) =>
  titles.filter((title) => title.type === type).map(({ id }) => id);

/**
 * A new member's library at `stage`, made from the wall's own picks so their posters fill the reel: the first ones
 * seen (a show's pilot, or the movie), the next ones watchlisted, and the first seen ones rated.
 */
export function toDemoLibrary(stage: LibraryStage, picks: readonly Title[]): DemoLibrary {
  const titles = padded(picks);
  const watched = titles.slice(0, stage.watched);
  const watchlisted = titles.slice(stage.watched, stage.watched + stage.watchlisted);
  const rated = watched.slice(0, stage.rated);

  return {
    watchedMovies: new Map(ids(watched, 'movie').map((id) => [id, [WATCHED_AT]])),
    watchedShows: new Map(
      ids(watched, 'show').map((id) => [id, new Map([[1, new Map([[id * 1000 + 1, [WATCHED_AT]]])]])]),
    ),
    watchlist: { movie: new Set(ids(watchlisted, 'movie')), show: new Set(ids(watchlisted, 'show')) },
    ratings: {
      movie: new Map(ids(rated, 'movie').map((id) => [id, 8])),
      show: new Map(ids(rated, 'show').map((id) => [id, 9])),
      season: new Map(),
      episode: new Map(),
    },
    network: {
      following: new Set(['og_tester', 'lena-fischer', 'reelnerd'].slice(0, stage.following)),
      followers: new Set(),
    },
  };
}
