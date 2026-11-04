import { describe, expect, it } from 'vitest';
import { toMatchLevel } from './toMatchLevel.ts';

describe('toMatchLevel', () => {
  it.each([
    [100, 'soulmates'],
    [90, 'soulmates'],
    [89, 'co-stars'],
    [75, 'co-stars'],
    [74, 'crossover'],
    [60, 'crossover'],
    [59, 'spin-off'],
    [45, 'spin-off'],
    [44, 'cameo'],
    [25, 'cameo'],
    [24, 'different-universe'],
    [0, 'different-universe'],
  ])('should put %i on %s, like v3', (score, key) => {
    expect(toMatchLevel(score).key).toBe(key);
  });

  it('should name the level and add its line', () => {
    expect(toMatchLevel(62)).toEqual({
      key: 'crossover',
      label: 'Crossover',
      line: 'Your worlds collide often. Plenty in common.',
    });
  });
});
