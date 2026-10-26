import { describe, expect, it } from 'vitest';
import { edgeEntrance } from './edgeEntrance.ts';

const sequence =
  (...values: number[]) =>
  () =>
    values.shift() ?? 0;

describe('edgeEntrance', () => {
  it('should pick each edge from its quarter of the range', () => {
    expect(edgeEntrance(sequence(0, 0.5)).edge).toBe('top');
    expect(edgeEntrance(sequence(0.3, 0.5)).edge).toBe('right');
    expect(edgeEntrance(sequence(0.6, 0.5)).edge).toBe('bottom');
    expect(edgeEntrance(sequence(0.99, 0.5)).edge).toBe('left');
  });

  it('should keep it away from the corners', () => {
    expect(edgeEntrance(sequence(0, 0)).along).toBe(20);
    expect(edgeEntrance(sequence(0, 0.5)).along).toBe(50);
    expect(edgeEntrance(sequence(0, 0.9999)).along).toBe(80);
  });
});
