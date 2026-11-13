import { describe, expect, it } from 'vitest';
import { hasEpisodeAired } from './hasEpisodeAired.ts';

const now = Date.parse('2026-09-30T20:00:00.000Z');

describe('hasEpisodeAired', () => {
  it('should count an episode out by now', () => {
    expect(hasEpisodeAired('2026-09-30T20:00:00.000Z', now)).toBe(true);
  });

  it('should leave out an episode still to come, even within a day', () => {
    expect(hasEpisodeAired('2026-09-30T20:01:00.000Z', now)).toBe(false);
  });

  it('should leave out an episode without a date', () => {
    expect(hasEpisodeAired(undefined, now)).toBe(false);
  });
});
