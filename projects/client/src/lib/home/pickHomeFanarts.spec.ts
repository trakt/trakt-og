import { describe, expect, it } from 'vitest';
import { pickHomeFanarts } from './pickHomeFanarts.ts';

const sequence = (...values: number[]) => {
  const queue = [...values];
  return () => queue.shift() ?? 0;
};

describe('pickHomeFanarts', () => {
  it('should pick the asked number without repeats', () => {
    const pool = Array.from({ length: 30 }, (_, index) => index);
    const picked = pickHomeFanarts({ pool, count: 10, random: Math.random });

    expect(picked).toHaveLength(10);
    expect(new Set(picked).size).toBe(10);
    expect(picked.every((item) => pool.includes(item))).toBe(true);
  });

  it('should follow the random numbers it is given', () => {
    // 0.99 swaps the first slot with the last, then 0 keeps the second where it is.
    expect(pickHomeFanarts({ pool: ['a', 'b', 'c', 'd'], count: 2, random: sequence(0.99, 0) })).toEqual(['d', 'b']);
  });

  it('should return the whole pool when it is smaller than the count', () => {
    expect(pickHomeFanarts({ pool: ['a', 'b'], count: 10, random: sequence(0, 0) })).toEqual(['a', 'b']);
  });

  it('should leave the pool untouched', () => {
    const pool = ['a', 'b', 'c'];
    pickHomeFanarts({ pool, count: 3, random: sequence(0.9, 0.9, 0.9) });
    expect(pool).toEqual(['a', 'b', 'c']);
  });
});
