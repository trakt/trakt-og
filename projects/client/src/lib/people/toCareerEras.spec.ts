import { describe, expect, it } from 'vitest';
import type { PersonCredit } from './PersonCredit.ts';
import { toCareerEras } from './toCareerEras.ts';

const credit = (id: number, year: number | undefined, votes = 0, episodeCount = 0): PersonCredit => ({
  type: episodeCount ? 'show' : 'movie',
  id,
  href: `/movies/${id}`,
  title: `Title ${id}`,
  year,
  released: true,
  episodeCount,
  characters: '',
  sortBy: { released: '2000-01-01', title: `title ${id}`, percentage: 0, votes, runtime: 0, episodes: episodeCount },
});

describe('toCareerEras', () => {
  it('should cover every five years from the first credit to the last, empty ones included', () => {
    const eras = toCareerEras({ credits: [credit(1, 1998), credit(2, 2011)] });
    expect(eras.map(({ start, end }) => [start, end])).toEqual([
      [1995, 1999],
      [2000, 2004],
      [2005, 2009],
      [2010, 2014],
    ]);
    expect(eras.map(({ credits }) => credits.length)).toEqual([1, 0, 0, 1]);
  });

  it('should leave out credits with no year', () => {
    const eras = toCareerEras({ credits: [credit(1, 2008), credit(2, undefined)] });
    expect(eras).toHaveLength(1);
    expect(eras.at(0)?.credits).toHaveLength(1);
  });

  it('should pick the best-known credit by votes, with episodes counting up to a season', () => {
    const film = credit(1, 2008, 25_000);
    const cartoon = credit(2, 2009, 1_000, 60);
    const drama = credit(3, 2007, 10_000, 62);
    expect(toCareerEras({ credits: [film, cartoon, drama] }).at(0)?.top?.id).toBe(3);
  });

  it('should start and end with the span, but count every credit in its years', () => {
    const archive = credit(1, 1949);
    const eras = toCareerEras({ credits: [archive, credit(2, 2008), credit(3, 2009)], span: [credit(2, 2008)] });
    expect(eras.map(({ start }) => start)).toEqual([2005]);
    expect(eras.at(0)?.credits).toHaveLength(2);
  });

  it('should return nothing without dated credits', () => {
    expect(toCareerEras({ credits: [credit(1, undefined)] })).toEqual([]);
  });
});
