import { describe, expect, it } from 'vitest';
import { isWatchingHere } from './isWatchingHere.ts';

const episode = { item: { type: 'episode', id: 1234 }, showId: 77 } as const;
const movie = { item: { type: 'movie', id: 432 }, showId: null } as const;

describe('isWatchingHere', () => {
  it("should match the movie's own page", () => {
    expect(isWatchingHere({ watching: movie, item: { type: 'movie', id: 432 } })).toBe(true);
    expect(isWatchingHere({ watching: movie, item: { type: 'movie', id: 433 } })).toBe(false);
  });

  it("should match the episode's own page and not a movie with the same id", () => {
    expect(isWatchingHere({ watching: episode, item: { type: 'episode', id: 1234 } })).toBe(true);
    expect(isWatchingHere({ watching: episode, item: { type: 'movie', id: 1234 } })).toBe(false);
  });

  it("should match any episode on the show's pages", () => {
    expect(isWatchingHere({ watching: episode, item: { type: 'episode', id: 999 }, show: 77 })).toBe(true);
    expect(isWatchingHere({ watching: episode, show: 78 })).toBe(false);
    expect(isWatchingHere({ watching: movie, show: 77 })).toBe(false);
  });

  it('should not match while nothing is playing', () => {
    expect(isWatchingHere({ watching: null, item: { type: 'movie', id: 432 } })).toBe(false);
  });
});
