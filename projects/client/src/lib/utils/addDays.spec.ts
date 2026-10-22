import { describe, expect, it } from 'vitest';
import { addDays } from './addDays.ts';

describe('util: addDays', () => {
  it('should move across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('should ignore DST changes', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
  });
});
