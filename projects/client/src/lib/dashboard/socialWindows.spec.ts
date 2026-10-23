import { describe, expect, it } from 'vitest';
import { socialWindows } from './socialWindows.ts';

const now = new Date('2026-09-30T12:00:30.500Z');

describe('socialWindows', () => {
  it('should ask for the last 24 hours today, to the minute', () => {
    expect(socialWindows('today', now, 'UTC')).toEqual([
      { start: '2026-09-29T12:00:00.000Z', end: '2026-09-30T12:00:00.000Z' },
    ]);
  });

  it('should ask for seven 24-hour windows back to back for the week, newest first', () => {
    const week = socialWindows('week', now, 'UTC');

    expect(week).toHaveLength(7);
    expect(week.at(1)).toEqual({ start: '2026-09-28T12:00:00.000Z', end: '2026-09-29T12:00:00.000Z' });
    expect(week.at(-1)?.start).toBe('2026-09-23T12:00:00.000Z');
  });

  it("should ask for yesterday as the viewer's calendar day", () => {
    expect(socialWindows('yesterday', now, 'UTC')).toEqual([
      { start: '2026-09-29T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' },
    ]);
    expect(socialWindows('yesterday', now, 'America/New_York')).toEqual([
      { start: '2026-09-29T04:00:00.000Z', end: '2026-09-30T04:00:00.000Z' },
    ]);
  });

  it('should cut a 25-hour yesterday to the 24 hours the worker allows', () => {
    // Daylight saving time ended on Sunday, November 1, in New York.
    const after = new Date('2026-11-02T15:00:00.000Z');

    expect(socialWindows('yesterday', after, 'America/New_York')).toEqual([
      { start: '2026-11-01T04:00:00.000Z', end: '2026-11-02T04:00:00.000Z' },
    ]);
  });

  it('should start a 23-hour yesterday at its midnight when the clocks went forward', () => {
    expect(socialWindows('yesterday', new Date('2026-03-09T15:00:00.000Z'), 'America/New_York')).toEqual([
      { start: '2026-03-08T05:00:00.000Z', end: '2026-03-09T04:00:00.000Z' },
    ]);
    // Lord Howe Island moves half an hour on October 4, 2026.
    expect(socialWindows('yesterday', new Date('2026-10-05T03:00:00.000Z'), 'Australia/Lord_Howe')).toEqual([
      { start: '2026-10-03T13:30:00.000Z', end: '2026-10-04T13:00:00.000Z' },
    ]);
  });

  it('should find midnight in a half-hour zone', () => {
    expect(socialWindows('yesterday', now, 'Asia/Kolkata')).toEqual([
      { start: '2026-09-28T18:30:00.000Z', end: '2026-09-29T18:30:00.000Z' },
    ]);
  });

  it('should start a day at 1:00 am when the clocks skip its midnight', () => {
    // Santiago goes from midnight to 1:00 am on September 6, 2026.
    expect(socialWindows('yesterday', new Date('2026-09-07T15:00:00.000Z'), 'America/Santiago')).toEqual([
      { start: '2026-09-06T04:00:00.000Z', end: '2026-09-07T03:00:00.000Z' },
    ]);
  });
});
