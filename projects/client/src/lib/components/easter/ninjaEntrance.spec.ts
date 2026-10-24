import { describe, expect, it } from 'vitest';
import { ninjaEntrance } from './ninjaEntrance.ts';

const sequence =
  (...values: number[]) =>
  () =>
    values.shift() ?? 0;

describe('ninjaEntrance', () => {
  it('should pick each edge from its quarter of the range', () => {
    expect(ninjaEntrance(sequence(0, 0.5)).edge).toBe('top');
    expect(ninjaEntrance(sequence(0.3, 0.5)).edge).toBe('right');
    expect(ninjaEntrance(sequence(0.6, 0.5)).edge).toBe('bottom');
    expect(ninjaEntrance(sequence(0.99, 0.5)).edge).toBe('left');
  });

  it('should keep him away from the corners', () => {
    expect(ninjaEntrance(sequence(0, 0)).along).toBe(20);
    expect(ninjaEntrance(sequence(0, 0.5)).along).toBe(50);
    expect(ninjaEntrance(sequence(0, 0.9999)).along).toBe(80);
  });
});
