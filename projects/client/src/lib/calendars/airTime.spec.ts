import { afterEach, describe, expect, it, vi } from 'vitest';
import { airTime } from './airTime.ts';

describe('airTime', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should format a 12-hour time in the viewer zone', () => {
    expect(airTime('2026-10-23T01:00:00Z', { timeZone: 'America/New_York', hour24: false })).toBe('9:00 pm');
  });

  it('should format a 24-hour time in the viewer zone', () => {
    expect(airTime('2026-10-23T01:00:00Z', { timeZone: 'America/New_York', hour24: true })).toBe('21:00');
  });

  it('should reuse one formatter per time zone and hour cycle', () => {
    const create = vi.spyOn(Intl, 'DateTimeFormat');
    const clock = { timeZone: 'Asia/Tokyo', hour24: true };
    airTime('2026-10-23T01:00:00Z', clock);
    airTime('2026-10-23T02:00:00Z', clock);
    airTime('2026-10-23T02:00:00Z', { ...clock, hour24: false });
    expect(create).toHaveBeenCalledTimes(2);
  });
});
