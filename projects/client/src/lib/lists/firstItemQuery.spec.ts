import { describe, expect, it } from 'vitest';
import { firstItemQuery } from './firstItemQuery.ts';

describe('firstItemQuery', () => {
  it('should drop the filters and read one item off page one', () => {
    expect(
      firstItemQuery({
        sortBy: 'title',
        sortHow: 'desc',
        types: ['movie'],
        genres: ['drama'],
        hide: ['watched'],
        terms: 'heat',
        watchnow: 'netflix',
        page: 3,
        limit: 42,
      }),
    ).toEqual({
      sortBy: 'title',
      sortHow: 'desc',
      types: [],
      genres: [],
      hide: [],
      terms: undefined,
      watchnow: undefined,
      page: 1,
      limit: 1,
    });
  });
});
