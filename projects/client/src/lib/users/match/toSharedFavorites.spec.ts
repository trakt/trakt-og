import type { FavoriteMovieResponse, FavoriteShowResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toSharedFavorites } from './toSharedFavorites.ts';

const media = (id: number, title: string) => ({ title, year: 2000, ids: { trakt: id, slug: `${title}-${id}` } });
const movie = (id: number, title: string) =>
  ({ type: 'movie', movie: media(id, title), notes: null }) as unknown as FavoriteMovieResponse;
const show = (id: number, title: string) =>
  ({ type: 'show', show: media(id, title), notes: null }) as unknown as FavoriteShowResponse;
const titles = (cards: readonly { title: string }[]) => cards.map(({ title }) => title);
const first = () => 0;
const last = () => 0.999;

describe('toSharedFavorites', () => {
  const rows = [movie(1, 'alien'), show(1, 'lost'), movie(2, 'heat'), show(3, 'angel'), movie(4, 'tron')];

  it('should keep only the shared ones, matching each id to its own type', () => {
    const cards = toSharedFavorites(rows, { movies: [4, 1], shows: [3] }, 6, first);
    expect(titles(cards).toSorted()).toEqual(['alien', 'angel', 'tron']);
  });

  it('should pick at random', () => {
    const shared = { movies: [1, 2, 4], shows: [1, 3] };
    expect(titles(toSharedFavorites(rows, shared, 6, first))).not.toEqual(
      titles(toSharedFavorites(rows, shared, 6, last)),
    );
  });

  it('should stop at the limit', () => {
    expect(toSharedFavorites(rows, { movies: [1, 2, 4], shows: [1, 3] }, 3, first)).toHaveLength(3);
  });

  it('should skip a shared id the owner no longer has', () => {
    expect(toSharedFavorites(rows, { movies: [99], shows: [] }, 6, first)).toEqual([]);
  });
});
