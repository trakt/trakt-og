import type { FavoriteMovieResponse, FavoriteShowResponse } from '@trakt/api';
import { type FavoriteCard, toFavoriteCard } from '../profile/toProfileSummary.ts';
import type { UserMatch } from './UserMatch.ts';

/** `limit` of the owner's favorites the viewer shares, shows and movies alike, picked at random. */
export function toSharedFavorites(
  rows: readonly (FavoriteMovieResponse | FavoriteShowResponse)[],
  shared: UserMatch['sharedFavorites'],
  limit: number,
  random: () => number,
): readonly FavoriteCard[] {
  const wanted = { movie: new Set(shared.movies), show: new Set(shared.shows) };
  const cards = rows.map(toFavoriteCard).filter((card) => wanted[card.type].has(card.id));
  // Fisher-Yates.
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards.slice(0, limit);
}
