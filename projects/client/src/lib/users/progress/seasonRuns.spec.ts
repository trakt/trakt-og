import { describe, expect, it } from 'vitest';
import { seasonRuns } from './seasonRuns.ts';

describe('seasonRuns', () => {
  it('should name one season by itself', () => {
    expect(seasonRuns([4])).toBe('Season 4');
  });

  it('should join neighbors into a run, in order, and keep Specials apart', () => {
    expect(seasonRuns([12, 0, 9, 10, 1, 11])).toBe('Specials, Season 1, Seasons 9 to 12');
  });
});
