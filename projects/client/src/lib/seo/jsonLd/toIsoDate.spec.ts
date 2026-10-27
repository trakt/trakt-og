import { describe, expect, it } from 'vitest';
import { toIsoDate } from './toIsoDate.ts';

describe('seo: toIsoDate', () => {
  it('should keep the day of a date or timestamp', () => {
    expect(toIsoDate('2010-07-16')).toBe('2010-07-16');
    expect(toIsoDate('2022-02-18T02:00:00.000Z')).toBe('2022-02-18');
  });

  it('should be undefined for a missing or invalid date', () => {
    expect(toIsoDate(null)).toBeUndefined();
    expect(toIsoDate('soon')).toBeUndefined();
  });
});
