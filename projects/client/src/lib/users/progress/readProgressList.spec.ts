import { describe, expect, it } from 'vitest';
import { readProgressList } from './readProgressList.ts';

describe('readProgressList', () => {
  it('should read a personal list by its id', () => {
    expect(readProgressList('42')).toEqual({ kind: 'personal', id: 42, base: '/lists/42/items' });
  });

  it('should read the watchlist and favorites by owner', () => {
    expect(readProgressList('morbus/watchlist')).toEqual({
      kind: 'watchlist',
      owner: 'morbus',
      base: '/users/morbus/watchlist',
    });
    expect(readProgressList('3-dogs/favorites')).toEqual({
      kind: 'favorites',
      owner: '3-dogs',
      base: '/users/3-dogs/favorites',
    });
  });

  it('should ignore anything else', () => {
    expect(readProgressList(null)).toBeUndefined();
    expect(readProgressList('0')).toBeUndefined();
    expect(readProgressList('morbus/ratings')).toBeUndefined();
    expect(readProgressList('a/b/watchlist')).toBeUndefined();
  });
});
