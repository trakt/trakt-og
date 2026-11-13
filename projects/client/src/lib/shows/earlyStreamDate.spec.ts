import { describe, expect, it } from 'vitest';
import { earlyStreamDate } from './earlyStreamDate.ts';

describe('earlyStreamDate', () => {
  it('should give the streaming day when it comes days before the broadcast', () => {
    expect(
      earlyStreamDate({
        released: '2026-11-13',
        effective_release_date: '2026-11-13T14:00:00.000Z',
        first_aired: '2026-11-16T01:00:00.000Z',
      }),
    ).toBe('2026-11-13');
  });

  it('should leave a stream on the broadcast day to the air time', () => {
    expect(
      earlyStreamDate({
        released: '2026-11-15',
        effective_release_date: '2026-11-15T14:00:00.000Z',
        first_aired: '2026-11-16T01:00:00.000Z',
      }),
    ).toBeUndefined();
  });

  it('should leave an episode that streams after it airs to the air time', () => {
    expect(
      earlyStreamDate({
        released: '2026-11-20',
        effective_release_date: '2026-11-16T01:00:00.000Z',
        first_aired: '2026-11-16T01:00:00.000Z',
      }),
    ).toBeUndefined();
  });

  it('should give the streaming day for an episode with no broadcast', () => {
    expect(earlyStreamDate({ released: '2026-11-13', first_aired: null })).toBe('2026-11-13');
  });

  it('should be undefined without a streaming release', () => {
    expect(earlyStreamDate({ first_aired: '2026-11-16T01:00:00.000Z' })).toBeUndefined();
  });
});
