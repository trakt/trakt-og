import { describe, expect, it } from 'vitest';
import { heatLevel } from './heatLevel.ts';

describe('heatLevel', () => {
  it('should leave a country with nobody watching unshaded', () => {
    expect(heatLevel(0)).toBe(0);
  });

  it('should step up at 1, 5, 20, 60 and 150 watching', () => {
    expect([1, 4, 5, 19, 20, 59, 60, 149, 150, 900].map(heatLevel)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});
