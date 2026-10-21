import { describe, expect, it } from 'vitest';
import type { PersonCredit } from './PersonCredit.ts';
import { toKnownFor } from './toKnownFor.ts';

const credit = (id: number, type: PersonCredit['type'], votes: number, characters: string): PersonCredit => ({
  type,
  id,
  href: `/${type}s/${id}`,
  title: `Title ${id}`,
  released: true,
  episodeCount: 0,
  characters,
  sortBy: { released: '2000-01-01', title: `title ${id}`, percentage: 0, votes, runtime: 0, episodes: 0 },
});

const departments = [
  { id: 'directing', credits: [credit(1, 'show', 90, 'Director')] },
  {
    id: 'acting',
    credits: [
      credit(1, 'show', 90, 'Walter White'),
      credit(2, 'movie', 20, 'Shannon'),
      credit(3, 'movie', 50, 'Self'),
      credit(4, 'movie', 70, 'Joe Brody'),
    ],
  },
];

const items = [
  { type: 'movie' as const, movie: { ids: { trakt: 2 } } },
  { type: 'movie' as const, movie: { ids: { trakt: 3 } } },
  { type: 'show' as const, show: { ids: { trakt: 1 } } },
  { type: 'movie' as const, movie: { ids: { trakt: 4 } } },
  { type: 'movie' as const, movie: { ids: { trakt: 99 } } },
];

describe('toKnownFor', () => {
  it('should order the picks by votes and drop appearances as themselves', () => {
    const titles = toKnownFor({ items, departments, limit: 10 }).map(({ id }) => id);
    expect(titles).toEqual([1, 4, 2]);
  });

  it('should use the acting credit for a title that is in more than one department', () => {
    const [first] = toKnownFor({ items, departments, limit: 10 });
    expect(first?.characters).toBe('Walter White');
  });

  it("should lead with picks from the person's own department", () => {
    const acting = [
      ...departments,
      { id: 'production', credits: [credit(5, 'movie', 999, 'Producer')] },
    ];
    const picks = [...items, { type: 'movie' as const, movie: { ids: { trakt: 5 } } }];
    expect(toKnownFor({ items: picks, departments: acting, department: 'acting', limit: 10 }).map(({ id }) => id))
      .toEqual([1, 4, 2, 5]);
  });

  it('should keep only as many as the limit', () => {
    expect(toKnownFor({ items, departments, limit: 2 })).toHaveLength(2);
  });

  it('should skip picks the credits do not have', () => {
    const ids = toKnownFor({ items, departments, limit: 10 }).map(({ id }) => id);
    expect(ids).not.toContain(99);
  });
});
