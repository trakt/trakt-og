import { describe, expect, it } from 'vitest';
import { isEpisodeWatchable } from './isEpisodeWatchable.ts';

const now = Date.parse('2026-09-30T20:00:00.000Z');

describe('isEpisodeWatchable', () => {
  it('should open an episode that is out', () => {
    expect(isEpisodeWatchable('2026-09-30T14:00:00.000Z', now)).toBe(true);
  });

  it('should open an episode out within a day', () => {
    expect(isEpisodeWatchable('2026-10-01T20:00:00.000Z', now)).toBe(true);
  });

  it('should lock an episode out more than a day away', () => {
    expect(isEpisodeWatchable('2026-10-01T20:01:00.000Z', now)).toBe(false);
  });

  it('should lock an episode without a date', () => {
    expect(isEpisodeWatchable(undefined, now)).toBe(false);
  });
});
