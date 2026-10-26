import { describe, expect, it } from 'vitest';
import { playsLines } from './playsLines.ts';

describe('playsLines', () => {
  it('should give one play its date, then its runtime', () => {
    expect(playsLines({ count: 1, minutes: 21, at: 'Feb 22, 2025' })).toEqual({
      lead: 'Watched',
      at: 'Feb 22, 2025',
      plays: undefined,
      time: '21m',
    });
  });

  it('should give more plays the last date, then the count and their time', () => {
    expect(playsLines({ count: 3, minutes: 63, at: 'Oct 20, 2026' })).toEqual({
      lead: 'Last watched',
      at: 'Oct 20, 2026',
      plays: '3 plays',
      time: '1h 3m',
    });
  });

  it('should just say watched without a date', () => {
    expect(playsLines({ count: 2 })).toEqual({ lead: 'Watched', at: undefined, plays: '2 plays', time: undefined });
    expect(playsLines({ count: 1 })).toEqual({ lead: 'Watched', at: undefined, plays: undefined, time: undefined });
  });
});
