import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRefreshSoon } from './createRefreshSoon.ts';

describe('createRefreshSoon', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should refresh once for a burst of calls', () => {
    const refresh = vi.fn(() => Promise.resolve());
    const soon = createRefreshSoon(refresh, 1500);
    for (let i = 0; i < 10; i++) {
      soon();
      vi.advanceTimersByTime(500);
    }
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('should refresh again for a later burst', () => {
    const refresh = vi.fn(() => Promise.resolve());
    const soon = createRefreshSoon(refresh, 1500);
    soon();
    vi.advanceTimersByTime(1500);
    soon();
    vi.advanceTimersByTime(1500);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
