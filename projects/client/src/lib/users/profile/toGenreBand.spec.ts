import { describe, expect, it } from 'vitest';
import type { GenreBar } from './toGenreBar.ts';
import { toGenreBand } from './toGenreBand.ts';

const genre = (name: string, percentage: number, shows = 2, movies = 3): GenreBar => ({
  slug: name.toLowerCase(),
  name,
  percentage,
  percentageRow: percentage * 2,
  percentageText: `${percentage}%`,
  shows,
  movies,
  counts: [
    {
      value: String(shows),
      noun: 'shows',
      href: `/users/sean/history/shows/plays?genres=${name.toLowerCase()}`,
    },
  ],
});

const genres = (shares: readonly number[]) => shares.map((share, i) => genre(`G${i + 1}`, share));

describe('mapper: toGenreBand', () => {
  describe('with seven genres or fewer', () => {
    it('should give every genre its own piece and no Other', () => {
      const band = toGenreBand(genres([30, 20, 15, 12, 10, 8, 5]));

      expect(band.other).toBeNull();
      expect(band.slices.map(({ slot }) => slot)).toEqual([1, 2, 3, 4, 5, 6, 1]);
    });
  });

  describe('with more than seven genres', () => {
    const band = toGenreBand([
      ...genres([30, 20, 15, 10, 8, 6]),
      genre('Animation', 4, 10, 0),
      genre('Horror', 2, 1, 5),
      genre('War', 1, 0, 1),
      genre('Musical', 0.08, 1, 1),
    ]);

    it('should keep the top six and fold the rest into Other', () => {
      expect(band.slices.map(({ name }) => name)).toEqual(['G1', 'G2', 'G3', 'G4', 'G5', 'G6']);
      expect(band.other).toMatchObject({ label: 'Other · 4 genres', share: '7.1%' });
      expect(band.other?.grow).toBeCloseTo(7.08);
    });

    it('should count the folded genres for the Other tooltip', () => {
      expect(band.other?.rest).toBe('4 genres');
    });

    it('should scale the tail mini bars to the biggest genre in the tail', () => {
      expect(band.other?.tail.map(({ name, share, mini }) => [name, share, mini])).toEqual([
        ['Animation', '4%', 100],
        ['Horror', '2%', 50],
        ['War', '1%', 25],
        ['Musical', '<0.1%', 2],
      ]);
    });
  });

  it('should label a genre with its share', () => {
    const [, second] = toGenreBand([genre('Drama', 31, 240, 380), genre('Comedy', 8.94, 1, 0)]).slices;
    expect(second?.share).toBe('8.9%');
  });
});
