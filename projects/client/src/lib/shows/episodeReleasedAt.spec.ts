import { describe, expect, it } from 'vitest';
import { episodeReleasedAt } from './episodeReleasedAt.ts';

describe('episodeReleasedAt', () => {
  it('should take the effective release date, an early stream before the broadcast', () => {
    expect(
      episodeReleasedAt({
        first_aired: '2026-10-05T01:00:00.000Z',
        effective_release_date: '2026-10-02T14:00:00.000Z',
      }),
    ).toBe('2026-10-02T14:00:00.000Z');
  });

  it('should fall back to the broadcast without one', () => {
    expect(episodeReleasedAt({ first_aired: '2026-10-05T01:00:00.000Z', effective_release_date: null })).toBe(
      '2026-10-05T01:00:00.000Z',
    );
  });

  it('should be undefined without either', () => {
    expect(episodeReleasedAt({})).toBeUndefined();
  });
});
