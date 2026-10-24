import { describe, expect, it } from 'vitest';
import { gifQueryOf } from './gifQueryOf.ts';

describe('util: gifQueryOf', () => {
  it('should search a movie by its title', () => {
    expect(gifQueryOf({ type: 'movie', id: 1, title: 'Toy Story 5' })).toBe('Toy Story 5');
  });

  it("should search an episode or season by its show's title", () => {
    expect(gifQueryOf({ type: 'episode', id: 2, title: 'Breaking Bad 1x01 "Pilot"', show: 1, season: 1 })).toBe(
      'Breaking Bad',
    );
    expect(gifQueryOf({ type: 'season', id: 3, title: 'Severance Season 2', show: 1, number: 2 })).toBe('Severance');
  });

  it('should leave lists and unknown items to trending', () => {
    expect(gifQueryOf({ type: 'list', id: 4, title: 'Favorites' })).toBeUndefined();
    expect(gifQueryOf(undefined)).toBeUndefined();
  });
});
