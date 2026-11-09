import { describe, expect, it } from 'vitest';
import { pickFranchiseFeature } from './pickFranchiseFeature.ts';
import type { FranchiseRow } from './FranchiseRow.ts';

const movie = (id: number, watched: boolean, released = true): FranchiseRow['movies'][number] => ({
  id,
  title: `Movie ${id}`,
  href: `/movies/movie-${id}`,
  runtime: 100,
  watched,
  released,
  releaseDate: `20${10 + id}-01-01`,
});

describe('pickFranchiseFeature', () => {
  it('should feature the first released movie not watched as up next', () => {
    const feature = pickFranchiseFeature([movie(1, true), movie(2, false), movie(3, false), movie(4, false, false)]);

    expect(feature).toMatchObject({ kind: 'up-next', movie: { id: 2 }, tag: { text: 'Up next', kind: 'primary' } });
  });

  it('should skip an unwatched movie that is not out yet for up next', () => {
    expect(pickFranchiseFeature([movie(1, false), movie(2, false, false)])?.movie.id).toBe(1);
  });

  it('should feature the earliest movie not out yet, with its release date, once every released one is watched', () => {
    const feature = pickFranchiseFeature([
      movie(1, true),
      movie(2, true),
      movie(3, false, false),
      movie(4, false, false),
    ]);

    expect(feature).toEqual({ kind: 'soon', movie: expect.objectContaining({ id: 3 }), next: '2013-01-01' });
  });

  it('should feature the latest released movie as caught up with nothing to come', () => {
    const feature = pickFranchiseFeature([movie(1, true), movie(2, true)]);

    expect(feature).toEqual({ kind: 'caught-up', movie: expect.objectContaining({ id: 2 }) });
  });

  it('should have nothing to feature without movies', () => {
    expect(pickFranchiseFeature([])).toBeUndefined();
  });
});
