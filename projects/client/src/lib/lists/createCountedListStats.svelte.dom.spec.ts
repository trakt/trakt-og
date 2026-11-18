import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recentReads } from '../api/recentReads.ts';
import { createCountedListStats } from './createCountedListStats.svelte.ts';
import { fetchListStats } from './fetchListStats.ts';
import type { ListStatsRead } from './ListStatsRead.ts';
import type { ListStats } from './toListStats.ts';

vi.mock('../auth/viewerFetch.ts', () => ({ viewerFetch: () => fetch }));
vi.mock('./fetchListStats.ts', () => ({ fetchListStats: vi.fn() }));

const counted = { count: 250 } as ListStats;
const statsRead = (base: string): ListStatsRead => ({
  base,
  query: {} as ListStatsRead['query'],
  total: 250,
  withItems: false,
  viewer: false,
});

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  recentReads.forget();
  vi.mocked(fetchListStats).mockReset();
});

const track = (read: () => ListStatsRead | null) => {
  let counting!: ReturnType<typeof createCountedListStats>;
  cleanups.push(
    $effect.root(() => {
      counting = createCountedListStats(read);
    }),
  );
  flushSync();
  return counting;
};

describe('createCountedListStats', () => {
  it('should read nothing for a list whose stats came with the page', () => {
    const counting = track(() => null);

    expect(counting.settled).toBeUndefined();
    expect(fetchListStats).not.toHaveBeenCalled();
  });

  it("should hand over the count for the page's own read", async () => {
    vi.mocked(fetchListStats).mockResolvedValue(counted);
    const read = statsRead('/lists/2142753/items');
    const counting = track(() => read);

    await expect(counting.stats).resolves.toBe(counted);
    await vi.waitFor(() => expect(counting.settled).toBe(counted));
  });

  it('should hand over the kept count on the next visit without counting again', async () => {
    vi.mocked(fetchListStats).mockResolvedValue(counted);
    const first = statsRead('/lists/1/items');
    const next = statsRead('/lists/1/items');
    track(() => first);
    const again = track(() => next);

    await vi.waitFor(() => expect(again.settled).toBe(counted));
    expect(fetchListStats).toHaveBeenCalledTimes(1);
  });

  it('should settle to null when the count fails', async () => {
    vi.mocked(fetchListStats).mockRejectedValue(new Error('down'));
    const read = statsRead('/lists/2142753/items');
    const counting = track(() => read);

    await vi.waitFor(() => expect(counting.settled).toBeNull());
  });

  it("should not show one list's count on the next", async () => {
    vi.mocked(fetchListStats).mockResolvedValue(counted);
    let read = $state.raw(statsRead('/lists/1/items'));
    const counting = track(() => read);
    await vi.waitFor(() => expect(counting.settled).toBe(counted));

    vi.mocked(fetchListStats).mockReturnValue(new Promise(() => {}));
    read = statsRead('/lists/2/items');
    flushSync();

    expect(counting.settled).toBeUndefined();
  });
});
