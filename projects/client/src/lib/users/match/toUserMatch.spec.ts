import { describe, expect, it } from 'vitest';
import { toUserMatch } from './toUserMatch.ts';

const body = (overrides: Partial<Parameters<typeof toUserMatch>[0]> = {}): Parameters<typeof toUserMatch>[0] => ({
  score: 62,
  breakdown: { subgenres: 55, favorites: 40 },
  shared: {
    subgenres: [
      { name: 'anthropomorphism', slug: 'anthropomorphism', rarity: 0.62 },
      { name: 'magic', slug: 'magic', rarity: 0.1 },
      { name: 'hero', slug: 'hero' },
    ],
    favorites: { movies: [3], shows: [7, 9] },
  },
  ...overrides,
});

describe('toUserMatch', () => {
  it('should map the score, its level, its parts and what they share', () => {
    expect(toUserMatch(body())).toEqual({
      score: 62,
      level: expect.objectContaining({ key: 'crossover', label: 'Crossover' }),
      subgenres: 55,
      favorites: 40,
      sharedSubgenres: [
        { name: 'anthropomorphism', slug: 'anthropomorphism', tier: 'top' },
        { name: 'magic', slug: 'magic', tier: 'strong' },
        { name: 'hero', slug: 'hero', tier: 'strong' },
      ],
      sharedFavorites: { movies: [3], shows: [7, 9] },
    });
  });

  it('should tier the topics like v3: the first and rare ones top, the next two strong, the rest light', () => {
    const topic = (slug: string, rarity?: number) => ({ name: slug, slug, rarity });
    const match = toUserMatch(
      body({
        shared: {
          subgenres: [topic('a', 0.1), topic('b'), topic('c'), topic('d', 0.7), topic('e')],
          favorites: { movies: [], shows: [] },
        },
      }),
    );
    expect(match?.sharedSubgenres.map(({ tier }) => tier)).toEqual(['top', 'strong', 'strong', 'top', 'light']);
  });

  it('should round and clamp the percentages', () => {
    const match = toUserMatch(body({ score: 101.4, breakdown: { subgenres: -2, favorites: 49.6 } }));
    expect(match).toMatchObject({ score: 100, subgenres: 0, favorites: 50 });
  });

  it('should have nothing to show for a 0 with nothing shared', () => {
    expect(
      toUserMatch(
        body({
          score: 0,
          breakdown: { subgenres: 0, favorites: 0 },
          shared: { subgenres: [], favorites: { movies: [], shows: [] } },
        }),
      ),
    ).toBeNull();
  });

  it('should keep a 0 that still shares something', () => {
    const match = toUserMatch(body({ score: 0, shared: { subgenres: [], favorites: { movies: [1], shows: [] } } }));
    expect(match?.level.key).toBe('different-universe');
  });
});
