import { describe, expect, it } from 'vitest';
import { fromWallClock } from './fromWallClock.ts';

const instant = (wall: string, timeZone: string) =>
  new Date(fromWallClock(Date.parse(`${wall}Z`), timeZone)).toISOString();

describe('util: fromWallClock', () => {
  it('should find a wall clock time on either side of a DST change', () => {
    expect(instant('2026-03-07T21:00:00', 'America/New_York')).toBe('2026-03-08T02:00:00.000Z');
    expect(instant('2026-03-08T21:00:00', 'America/New_York')).toBe('2026-03-09T01:00:00.000Z');
    expect(instant('2026-03-29T12:00:00', 'Europe/Berlin')).toBe('2026-03-29T10:00:00.000Z');
  });

  it('should move a time the clocks skip forward by the gap', () => {
    expect(instant('2026-03-08T02:30:00', 'America/New_York')).toBe('2026-03-08T07:30:00.000Z');
    expect(instant('2026-03-29T02:30:00', 'Europe/Berlin')).toBe('2026-03-29T01:30:00.000Z');
    expect(instant('2026-10-04T02:15:00', 'Australia/Lord_Howe')).toBe('2026-10-03T15:45:00.000Z');
  });

  it('should start a day at 1:00 am when the clocks skip its midnight', () => {
    expect(instant('2026-09-06T00:00:00', 'America/Santiago')).toBe('2026-09-06T04:00:00.000Z');
  });

  it('should pick the first of a repeated hour, behind UTC or ahead of it', () => {
    expect(instant('2026-11-01T01:30:00', 'America/New_York')).toBe('2026-11-01T05:30:00.000Z');
    expect(instant('2026-10-25T02:30:00', 'Europe/Berlin')).toBe('2026-10-25T00:30:00.000Z');
    expect(instant('2026-04-05T01:45:00', 'Australia/Lord_Howe')).toBe('2026-04-04T14:45:00.000Z');
  });

  it('should keep half-hour zones and milliseconds exact', () => {
    expect(instant('2026-09-29T00:00:00', 'Asia/Kolkata')).toBe('2026-09-28T18:30:00.000Z');
    expect(instant('2026-09-29T21:00:00.250', 'Asia/Kolkata')).toBe('2026-09-29T15:30:00.250Z');
  });
});
