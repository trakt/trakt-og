import type { UpNextResponse } from '@trakt/api';
import { describe, expect, it, vi } from 'vitest';
import { loadNitroProgress, type NitroIntent, type NitroPage } from './loadNitroProgress.ts';

const row = (id: number): UpNextResponse =>
  ({
    show: { title: `Show ${id}`, ids: { trakt: id, slug: `show-${id}` } },
    progress: {
      aired: 10,
      completed: 4,
      last_watched_at: '2026-10-01T20:00:00.000Z',
      reset_at: null,
      next_episode: null,
      last_episode: null,
    },
  }) as UpNextResponse;

const page = (ids: readonly number[], pageCount: number): NitroPage => ({
  ok: true,
  body: ids.map(row),
  headers: new Headers({ 'X-Pagination-Page-Count': String(pageCount) }),
});

const empty = page([], 1);

describe('loadNitroProgress', () => {
  it('should read the first page, then the rest together, 100 a page', async () => {
    const request = vi.fn((intent: NitroIntent, index: number) =>
      Promise.resolve(intent === 'all' ? page([index * 10, index * 10 + 1], 3) : empty),
    );

    const items = await loadNitroProgress({ request, now: () => 0 });

    expect(request.mock.calls.filter(([intent]) => intent === 'all')).toEqual([
      ['all', 1, 100],
      ['all', 2, 100],
      ['all', 3, 100],
    ]);
    expect(items.map(({ show }) => show.id)).toEqual([10, 11, 20, 21, 30, 31]);
  });

  it('should add the completed shows after the unfinished ones', async () => {
    const request = vi.fn((intent: NitroIntent, index: number) =>
      Promise.resolve(intent === 'all' ? page([1, 2], 1) : page(index === 1 ? [3] : [4], 2)),
    );

    const items = await loadNitroProgress({ request });

    expect(request.mock.calls).toEqual(
      expect.arrayContaining([
        ['completed', 1, 100],
        ['completed', 2, 100],
      ]),
    );
    expect(items.map(({ show }) => show.id)).toEqual([1, 2, 3, 4]);
    expect(items.map(({ latestWatched }) => latestWatched)).toEqual([false, false, true, true]);
  });

  it('should keep the first copy of a show that moved between pages', async () => {
    const request = vi.fn((intent: NitroIntent, index: number) =>
      Promise.resolve(intent === 'all' ? page(index === 1 ? [1, 2] : [2, 3], 2) : empty),
    );

    expect((await loadNitroProgress({ request })).map(({ show }) => show.id)).toEqual([1, 2, 3]);
  });

  it('should keep one copy of a show that finished while the intents loaded', async () => {
    const request = vi.fn((intent: NitroIntent) => Promise.resolve(intent === 'all' ? page([1, 2], 1) : page([2], 1)));

    const items = await loadNitroProgress({ request });
    expect(items.map(({ show }) => show.id)).toEqual([1, 2]);
    expect(items.at(1)?.latestWatched).toBe(false);
  });

  it('should fail when a page does', async () => {
    const request = vi.fn((intent: NitroIntent, index: number) =>
      Promise.resolve(intent === 'all' || index === 1 ? page([1], 2) : { ok: false as const, status: 502 }),
    );

    await expect(loadNitroProgress({ request })).rejects.toThrow('completed page 2: 502');
  });
});
