import { describe, expect, it } from 'vitest';
import { zoneOffset } from './zoneOffset.ts';

const HOUR = 3_600_000;
const MINUTE = 60_000;

describe('util: zoneOffset', () => {
  it("should give each date's own offset across a DST change", () => {
    expect(zoneOffset(Date.parse('2026-03-08T06:59:59Z'), 'America/New_York')).toBe(-5 * HOUR);
    expect(zoneOffset(Date.parse('2026-03-08T07:00:00Z'), 'America/New_York')).toBe(-4 * HOUR);
    expect(zoneOffset(Date.parse('2026-11-01T05:59:59Z'), 'America/New_York')).toBe(-4 * HOUR);
    expect(zoneOffset(Date.parse('2026-11-01T06:00:00Z'), 'America/New_York')).toBe(-5 * HOUR);
  });

  it('should keep half-hour offsets and half-hour daylight saving', () => {
    expect(zoneOffset(Date.parse('2026-09-30T12:00:00Z'), 'Asia/Kolkata')).toBe(5 * HOUR + 30 * MINUTE);
    expect(zoneOffset(Date.parse('2026-07-01T00:00:00Z'), 'Australia/Lord_Howe')).toBe(10 * HOUR + 30 * MINUTE);
    expect(zoneOffset(Date.parse('2026-12-01T00:00:00Z'), 'Australia/Lord_Howe')).toBe(11 * HOUR);
  });

  it('should be exact for an instant with milliseconds', () => {
    expect(zoneOffset(Date.parse('2026-09-30T12:00:30.999Z'), 'America/New_York')).toBe(-4 * HOUR);
    expect(zoneOffset(Date.parse('2026-09-30T12:00:30.999Z'), 'UTC')).toBe(0);
  });

  it('should throw for a zone it does not know', () => {
    expect(() => zoneOffset(0, 'Mars/Olympus_Mons')).toThrow(RangeError);
  });
});
