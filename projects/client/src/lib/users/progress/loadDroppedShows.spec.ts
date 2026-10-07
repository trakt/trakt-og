import type { HiddenShowItemResponse } from '@trakt/api';
import { describe, expect, it, vi } from 'vitest';
import { type DroppedPage, loadDroppedShows } from './loadDroppedShows.ts';

const row = (id: number): HiddenShowItemResponse => ({
  hidden_at: '2026-03-01T00:00:00.000Z',
  type: 'show',
  show: { title: `Show ${id}`, ids: { trakt: id, slug: `show-${id}` } },
} as unknown as HiddenShowItemResponse);

const page = (ids: readonly number[], pageCount: number): DroppedPage => ({
  ok: true,
  body: ids.map(row),
  headers: new Headers({ 'X-Pagination-Page-Count': String(pageCount) }),
});

describe('loadDroppedShows', () => {
  it('should read every page and key the summaries by show id', async () => {
    const request = vi.fn((index: number) => Promise.resolve(page([index], 2)));

    const shows = await loadDroppedShows({ request, now: () => 5 });

    expect(request.mock.calls).toEqual([[1, 100], [2, 100]]);
    expect([...shows.keys()]).toEqual([1, 2]);
    expect(shows.get(2)).toMatchObject({ slug: 'show-2', title: 'Show 2', fetchedAt: 5 });
  });

  it('should fail when a page does', async () => {
    const request = vi.fn(() => Promise.resolve({ ok: false as const, status: 500 }));

    await expect(loadDroppedShows({ request })).rejects.toThrow('page 1: 500');
  });
});
