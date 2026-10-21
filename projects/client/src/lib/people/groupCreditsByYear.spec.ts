import { describe, expect, it } from 'vitest';
import { groupCreditsByYear } from './groupCreditsByYear.ts';
import type { PersonCredit } from './PersonCredit.ts';

const credit = (id: number, year?: number): PersonCredit => ({
  type: 'movie',
  id,
  href: `/movies/${id}`,
  title: `Title ${id}`,
  year,
  released: true,
  episodeCount: 0,
  characters: '',
  sortBy: { released: '2000-01-01', title: `title ${id}`, percentage: 0, votes: 0, runtime: 0, episodes: 0 },
});

describe('groupCreditsByYear', () => {
  it('should group neighbouring credits that share a year, in order', () => {
    const groups = groupCreditsByYear([credit(1), credit(2, 2026), credit(3, 2026), credit(4, 2024)]);
    expect(groups.map(({ year, credits }) => [year, credits.map(({ id }) => id)])).toEqual([
      [undefined, [1]],
      [2026, [2, 3]],
      [2024, [4]],
    ]);
  });

  it('should return no groups for no credits', () => {
    expect(groupCreditsByYear([])).toEqual([]);
  });
});
