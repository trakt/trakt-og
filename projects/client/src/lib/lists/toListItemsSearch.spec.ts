import { describe, expect, it } from 'vitest';
import { toListItemsSearch } from './toListItemsSearch.ts';

describe('util: toListItemsSearch', () => {
  it('should send only the page, its size and the extended fields without filters', () => {
    expect(String(toListItemsSearch({ query: { genres: [] }, extended: 'full', page: 2, limit: 250 }))).toBe(
      'extended=full&page=2&limit=250',
    );
  });

  it('should leave the hides to the page, which applies them to the whole list', () => {
    const query = { genres: ['drama'], terms: 'Heat', watchnow: 'netflix', hide: ['watched', 'nonotes'] };
    const search = toListItemsSearch({
      query,
      extended: 'full',
      page: 1,
      limit: 24,
    });
    expect(Object.fromEntries(search)).toEqual({
      extended: 'full',
      page: '1',
      limit: '24',
      genres: 'drama',
      terms: 'Heat',
      watchnow: 'netflix',
    });
  });
});
