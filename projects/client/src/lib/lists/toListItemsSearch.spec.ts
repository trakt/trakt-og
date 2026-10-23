import { describe, expect, it } from 'vitest';
import { toListItemsSearch } from './toListItemsSearch.ts';

describe('util: toListItemsSearch', () => {
  it('should send only the page, its size and the extended fields without filters', () => {
    expect(String(toListItemsSearch({ query: { genres: [] }, extended: 'full', page: 2, limit: 250 }))).toBe(
      'extended=full&page=2&limit=250',
    );
  });

  it('should send every hide as a list and as its own flag', () => {
    const search = toListItemsSearch({
      query: { genres: ['drama'], terms: 'Heat', watchnow: 'netflix', hide: ['watched', 'nonotes'] },
      extended: 'full,images',
      page: 1,
      limit: 24,
    });
    expect(Object.fromEntries(search)).toEqual({
      extended: 'full,images',
      page: '1',
      limit: '24',
      genres: 'drama',
      terms: 'Heat',
      watchnow: 'netflix',
      hide: 'watched,nonotes',
      hide_watched: 'true',
      hide_no_notes: 'true',
    });
  });
});
