import { describe, expect, it } from 'vitest';
import { heatLevel } from './heatLevel.ts';

describe('heatLevel', () => {
  it('should leave a country with nobody watching unshaded', () => {
    expect(heatLevel(0)).toBe(0);
  });

  it('should step up at any share, then 0.15%, 0.6%, 2% and 5%', () => {
    expect([0.0003, 0.0014, 0.0015, 0.0059, 0.006, 0.019, 0.02, 0.049, 0.05, 0.22].map(heatLevel)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
    ]);
  });
});
