import { describe, expect, it } from 'vitest';
import { watchingProgress } from './watchingProgress.ts';

const endsAt = '2026-09-29T21:00:00.000Z';
const at = (iso: string) => Date.parse(iso);
const progress = (
  { runtime = 60, now, action = 'scrobble', reducedMotion = false }: {
    runtime?: number;
    now: string;
    action?: 'checkin' | 'scrobble';
    reducedMotion?: boolean;
  },
) => watchingProgress({ endsAt, runtime, action, now: at(now), reducedMotion });

describe('watchingProgress', () => {
  it('should measure from runtime before the end', () => {
    expect(progress({ now: '2026-09-29T20:15:00.000Z' })).toEqual({
      percent: 25,
      elapsed: '15:00',
      remaining: '45:00',
      finished: null,
      gone: false,
    });
  });

  it('should show hours with padded minutes and seconds', () => {
    const { elapsed, remaining } = progress({ runtime: 145, now: '2026-09-29T19:40:05.000Z' });

    expect(elapsed).toBe('1:05:05');
    expect(remaining).toBe('1:19:55');
  });

  it('should round time left up near the end', () => {
    expect(progress({ now: '2026-09-29T20:59:59.400Z' })).toMatchObject({ elapsed: '59:59', remaining: '0:01' });
  });

  it('should drop the seconds under reduced motion', () => {
    expect(progress({ runtime: 145, now: '2026-09-29T19:40:59.000Z', reducedMotion: true })).toMatchObject({
      elapsed: '1:05',
      remaining: '1:20',
    });
    expect(progress({ now: '2026-09-29T20:59:10.000Z', reducedMotion: true }).remaining).toBe('0:01');
  });

  it('should say a scrobble is finished once over time', () => {
    expect(progress({ now: '2026-09-29T21:02:00.000Z' })).toEqual({
      percent: 100,
      elapsed: '1:00:00',
      remaining: '0:00',
      finished: 'Finished',
      gone: false,
    });
  });

  it('should say a check-in is wrapping up once over time', () => {
    expect(progress({ now: '2026-09-29T21:00:00.000Z', action: 'checkin' }).finished).toBe('Wrapping up');
  });

  it('should go away five minutes past the end', () => {
    expect(progress({ now: '2026-09-29T21:04:59.000Z' }).gone).toBe(false);
    expect(progress({ now: '2026-09-29T21:05:00.000Z' }).gone).toBe(true);
  });

  it('should not go below 0 before the start', () => {
    expect(progress({ runtime: 30, now: '2026-09-29T20:00:00.000Z' })).toMatchObject({
      percent: 0,
      elapsed: '0:00',
      remaining: '30:00',
    });
  });
});
