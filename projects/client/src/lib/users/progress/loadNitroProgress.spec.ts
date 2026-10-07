import type { UpNextResponse } from '@trakt/api';
import { describe, expect, it, vi } from 'vitest';
import { loadNitroProgress, type NitroPage } from './loadNitroProgress.ts';

const row = (id: number): UpNextResponse => ({
  show: { title: `Show ${id}`, ids: { trakt: id, slug: `show-${id}` } },
  progress: {
    aired: 10,
    completed: 4,
    last_watched_at: '2026-10-01T20:00:00.000Z',
    reset_at: null,
    next_episode: null,
    last_episode: null,
  },
} as UpNextResponse);

const page = (ids: readonly number[], pageCount: number): NitroPage => ({
  ok: true,
  body: ids.map(row),
  headers: new Headers({ 'X-Pagination-Page-Count': String(pageCount) }),
});

describe('loadNitroProgress', () => {
  it('should read the first page, then the rest together, 100 a page', async () => {
    const request = vi.fn((index: number) => Promise.resolve(page([index * 10, index * 10 + 1], 3)));

    const items = await loadNitroProgress({ request, now: () => 0 });

    expect(request.mock.calls).toEqual([[1, 100], [2, 100], [3, 100]]);
    expect(items.map(({ show }) => show.id)).toEqual([10, 11, 20, 21, 30, 31]);
  });

  it('should keep the first copy of a show that moved between pages', async () => {
    const request = vi.fn((index: number) => Promise.resolve(page(index === 1 ? [1, 2] : [2, 3], 2)));

    expect((await loadNitroProgress({ request })).map(({ show }) => show.id)).toEqual([1, 2, 3]);
  });

  it('should fail when a page does', async () => {
    const request = vi.fn((index: number) =>
      Promise.resolve(index === 1 ? page([1], 2) : { ok: false as const, status: 502 })
    );

    await expect(loadNitroProgress({ request })).rejects.toThrow('page 2: 502');
  });
});
