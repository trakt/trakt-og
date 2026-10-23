import { describe, expect, it } from 'vitest';
import { nextNudge, type NudgeCounts } from './nudges.ts';

const counts = (overrides: Partial<NudgeCounts> = {}): NudgeCounts => ({
  watched: 0,
  tracked: 0,
  watchlisted: 0,
  rated: 0,
  favorited: 0,
  ...overrides,
});

const next = (before: Partial<NudgeCounts>, after: Partial<NudgeCounts>, hasServices = false) =>
  nextNudge({ before: counts(before), after: counts(after), hasServices, slug: 'jordan' })?.key ?? null;

describe('nextNudge', () => {
  it('should cheer the first title watched', () => {
    expect(next({}, { watched: 1 })).toBe('first-watch');
  });

  it('should only fire when a threshold is crossed on this page', () => {
    expect(next({ watched: 1 }, { watched: 2 })).toBeNull();
  });

  it('should offer services at three watchlisted, unless some are picked', () => {
    expect(next({ watchlisted: 2 }, { watchlisted: 3 })).toBe('services');
    expect(next({ watchlisted: 2 }, { watchlisted: 3 }, true)).toBeNull();
  });

  it('should point to recommendations at five ratings', () => {
    expect(next({ rated: 4 }, { rated: 5 })).toBe('ratings');
  });

  it('should suggest favorites at 25 titles only while there are none', () => {
    expect(next({ tracked: 24 }, { tracked: 25 })).toBe('favorites');
    expect(next({ tracked: 24, favorited: 1 }, { tracked: 25, favorited: 1 })).toBeNull();
  });
});
