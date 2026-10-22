import { describe, expect, it } from 'vitest';
import { dayIn } from './dayIn.ts';

describe('util: dayIn', () => {
  it('should give the calendar day in the zone', () => {
    expect(dayIn('2026-03-02T03:00:00Z', 'America/New_York')).toBe('2026-03-01');
    expect(dayIn('2026-03-02T03:00:00Z', 'Europe/Berlin')).toBe('2026-03-02');
  });

  it('should take a Date as well as a string', () => {
    expect(dayIn(new Date('2026-03-02T03:00:00Z'), 'UTC')).toBe('2026-03-02');
  });
});
