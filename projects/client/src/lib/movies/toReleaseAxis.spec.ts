import { describe, expect, it } from 'vitest';
import { toReleaseAxis } from './toReleaseAxis.ts';

describe('toReleaseAxis', () => {
  it('should place dates in order inside padded edges, with month ticks naming the year on the first and January', () => {
    const axis = toReleaseAxis({ dates: ['2026-07-27', '2026-10-06', '2027-01-15'], today: '2026-10-26' });
    const [first, middle, last] = axis.positions;
    expect(first).toBeGreaterThan(0);
    expect(middle).toBeGreaterThan(first ?? 0);
    expect(last).toBeLessThan(100);
    expect(axis.ticks.map(({ label }) => label)).toEqual(['Aug 2026', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan 2027']);
    expect(axis.today).toBeGreaterThan(middle ?? 0);
  });

  it('should tick years for a long span and leave today off an axis that ends before it', () => {
    const axis = toReleaseAxis({ dates: ['1999-10-15', '2008-11-18', '2019-12-10'], today: '2026-10-26' });
    expect(axis.ticks.length).toBeLessThanOrEqual(12);
    expect(axis.ticks.at(0)?.label).toBe('1999');
    expect(axis.ticks.every(({ at }) => at > 0 && at < 100)).toBe(true);
    expect(axis.today).toBeNull();
  });

  it('should give a single date a month of room around it', () => {
    const axis = toReleaseAxis({ dates: ['2026-07-29'], today: '2026-07-29' });
    expect(axis.positions.at(0)).toBeGreaterThan(0);
    expect(axis.positions.at(0)).toBeLessThan(10);
    expect(axis.today).toBe(axis.positions.at(0));
  });
});
