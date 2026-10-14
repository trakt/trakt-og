import { describe, expect, it } from 'vitest';
import { recapWindows } from './recapWindows.ts';

describe('recapWindows', () => {
  it('should give every month of the year up to today, the last one ending now', () => {
    const now = new Date('2026-03-12T15:00:00Z');
    expect(recapWindows({ now, timeZone: 'UTC' })).toEqual([
      { month: 1, start: '2026-01-01T00:00:00.000Z', end: '2026-02-01T00:00:00.000Z' },
      { month: 2, start: '2026-02-01T00:00:00.000Z', end: '2026-03-01T00:00:00.000Z' },
      { month: 3, start: '2026-03-01T00:00:00.000Z', end: '2026-03-12T15:00:00.000Z' },
    ]);
  });

  it("should start each month at midnight in the viewer's zone", () => {
    const now = new Date('2026-02-10T12:00:00Z');
    const [january] = recapWindows({ now, timeZone: 'America/New_York' });
    expect(january).toEqual({ month: 1, start: '2026-01-01T05:00:00.000Z', end: '2026-02-01T05:00:00.000Z' });
  });

  it('should follow a daylight saving change between months', () => {
    const now = new Date('2026-04-02T12:00:00Z');
    const march = recapWindows({ now, timeZone: 'America/New_York' }).at(2);
    expect(march).toEqual({ month: 3, start: '2026-03-01T05:00:00.000Z', end: '2026-04-01T04:00:00.000Z' });
  });

  it("should pick the year and month from the viewer's zone, not UTC", () => {
    const now = new Date('2026-01-01T03:00:00Z');
    const windows = recapWindows({ now, timeZone: 'America/Los_Angeles' });
    expect(windows).toHaveLength(12);
    expect(windows.at(-1)).toEqual({ month: 12, start: '2025-12-01T08:00:00.000Z', end: '2026-01-01T03:00:00.000Z' });
  });

  describe('in January', () => {
    it("should give last year's twelve whole months", () => {
      const now = new Date('2027-01-05T12:00:00Z');
      const windows = recapWindows({ now, timeZone: 'UTC' });
      expect(windows).toHaveLength(12);
      expect(windows.at(0)).toEqual({ month: 1, start: '2026-01-01T00:00:00.000Z', end: '2026-02-01T00:00:00.000Z' });
      expect(windows.at(-1)).toEqual({ month: 12, start: '2026-12-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' });
    });

    it("should end December at the viewer's midnight", () => {
      const now = new Date('2027-01-31T12:00:00Z');
      const december = recapWindows({ now, timeZone: 'America/New_York' }).at(-1);
      expect(december).toEqual({ month: 12, start: '2026-12-01T05:00:00.000Z', end: '2027-01-01T05:00:00.000Z' });
    });

    it('should switch to the new year on February 1st', () => {
      const now = new Date('2027-02-01T12:00:00Z');
      expect(recapWindows({ now, timeZone: 'UTC' })).toEqual([
        { month: 1, start: '2027-01-01T00:00:00.000Z', end: '2027-02-01T00:00:00.000Z' },
        { month: 2, start: '2027-02-01T00:00:00.000Z', end: '2027-02-01T12:00:00.000Z' },
      ]);
    });
  });

  it('should handle a zone ahead of UTC', () => {
    const now = new Date('2026-02-15T00:00:00Z');
    const [january] = recapWindows({ now, timeZone: 'Asia/Tokyo' });
    expect(january).toEqual({ month: 1, start: '2025-12-31T15:00:00.000Z', end: '2026-01-31T15:00:00.000Z' });
  });
});
