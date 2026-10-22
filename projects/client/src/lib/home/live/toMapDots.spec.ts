import { describe, expect, it } from 'vitest';
import { toMapDots } from './toMapDots.ts';

const world = { width: 30, height: 20, step: 10, codes: ['BR', 'US'], dots: [0, 0, 1, 2, 1, 0, 1, 1, 0] };

describe('toMapDots', () => {
  it('should place each dot at the middle of its cell with its country', () => {
    expect(toMapDots(world).dots).toEqual([
      { x: 5, y: 5, code: 'US' },
      { x: 25, y: 15, code: 'BR' },
      { x: 15, y: 15, code: 'BR' },
    ]);
  });

  it('should find the dot under any point of its cell', () => {
    const map = toMapDots(world);

    expect(map.at(28, 11)?.code).toBe('BR');
    expect(map.at(1, 9)?.code).toBe('US');
    expect(map.at(15, 5)).toBeUndefined();
  });

  it("should find a country's first dot", () => {
    expect(toMapDots(world).first('BR')).toEqual({ x: 25, y: 15, code: 'BR' });
  });
});
