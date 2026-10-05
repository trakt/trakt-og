import { describe, expect, it } from 'vitest';
import { reviewLinks } from './reviewLinks.ts';

describe('reviewLinks', () => {
  it('should link the current year and last month', () => {
    expect(reviewLinks({ slug: 'sean', now: new Date(2026, 9, 5) })).toEqual([
      { title: 'Year in Review', href: 'https://app.trakt.tv/users/sean/year/2026' },
      { title: 'Month in Review', href: 'https://app.trakt.tv/users/sean/mir/2026/9' },
    ]);
  });

  it('should link last year and last December in January', () => {
    expect(reviewLinks({ slug: 'sean', now: new Date(2027, 0, 31) })).toEqual([
      { title: 'Year in Review', href: 'https://app.trakt.tv/users/sean/year/2026' },
      { title: 'Month in Review', href: 'https://app.trakt.tv/users/sean/mir/2026/12' },
    ]);
  });

  it('should link the current year from February', () => {
    expect(reviewLinks({ slug: 'sean', now: new Date(2027, 1, 1) }).at(0)?.href)
      .toBe('https://app.trakt.tv/users/sean/year/2027');
  });

  it('should encode the slug', () => {
    expect(reviewLinks({ slug: 'a b', now: new Date(2026, 9, 5) }).at(0)?.href)
      .toBe('https://app.trakt.tv/users/a%20b/year/2026');
  });
});
