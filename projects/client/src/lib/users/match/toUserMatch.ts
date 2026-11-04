import type { z } from 'zod/v4';
import { toMatchLevel } from './toMatchLevel.ts';
import type { UserMatch } from './UserMatch.ts';
import type { userMatchSchema } from './userMatchSchema.ts';

// The API's rarity runs 0 to 1; from here up the sub-genre is rare among movies and shows both (trakt-web's unicorn).
const RARE_FROM = 0.5;
// The API orders shared sub-genres most telling first; the first and the next two get trakt-web's stronger chips.
const STRONG_UNTIL = 2;

const percent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const tier = (index: number, rarity: number | null | undefined): UserMatch['sharedSubgenres'][number]['tier'] => {
  if (index === 0 || (rarity ?? 0) >= RARE_FROM) return 'top';
  return index <= STRONG_UNTIL ? 'strong' : 'light';
};

/**
 * The match as the pill and its dialog show it, or null when there's nothing to compare: a 0 with nothing shared is
 * what the API answers when either member has watched too little.
 */
export function toUserMatch(body: z.infer<typeof userMatchSchema>): UserMatch | null {
  const score = percent(body.score);
  const { subgenres, favorites } = body.shared;
  if (score === 0 && subgenres.length === 0 && favorites.movies.length + favorites.shows.length === 0) return null;

  return {
    score,
    level: toMatchLevel(score),
    subgenres: percent(body.breakdown.subgenres),
    favorites: percent(body.breakdown.favorites),
    sharedSubgenres: subgenres.map(({ name, slug, rarity }, index) => ({ name, slug, tier: tier(index, rarity) })),
    sharedFavorites: { movies: favorites.movies, shows: favorites.shows },
  };
}
