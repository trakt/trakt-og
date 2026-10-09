import { describe, expect, it } from 'vitest';
import { nearbyMonths } from './nearbyMonths.ts';

describe('nearbyMonths', () => {
  it('should list the months around one, across years', () => {
    expect(nearbyMonths({ month: '2026-11-01', before: 2, after: 2 })).toEqual([
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
      '2027-01-01',
    ]);
  });
});
