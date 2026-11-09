import { describe, expect, it, vi } from 'vitest';
import { loadFranchiseCatalog, type FranchisePage } from './loadFranchiseCatalog.ts';

const row = (id: number) => ({
  list: {
    name: `Franchise ${id}`,
    ids: { trakt: id, slug: `f${id}-collection` },
    item_ids: { movies: [id, id + 100] },
  },
});

const page = (ids: readonly number[], pageCount: number): FranchisePage => ({
  ok: true,
  body: ids.map(row),
  headers: new Headers({ 'X-Pagination-Page-Count': String(pageCount) }),
});

describe('loadFranchiseCatalog', () => {
  it('should read the first page, then the rest', async () => {
    const request = vi.fn((index: number) => Promise.resolve(page([index], 3)));

    const franchises = await loadFranchiseCatalog({ request });

    expect(request.mock.calls).toEqual([[1], [2], [3]]);
    expect(franchises.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it('should never have more pages in flight than the cap', async () => {
    let active = 0;
    let peak = 0;
    const request = async (index: number) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return page([index], 10);
    };

    await loadFranchiseCatalog({ request, concurrency: 4 });

    expect(peak).toBe(4);
  });

  it('should list a franchise once when it moves between pages', async () => {
    const request = (index: number) => Promise.resolve(page([1, index], 2));

    const franchises = await loadFranchiseCatalog({ request });

    expect(franchises.map(({ id }) => id)).toEqual([1, 2]);
  });

  it('should count lists with the same movies once, the most liked', async () => {
    const twin = (id: number, likes: number) => ({
      like_count: likes,
      list: { name: `Twin ${id}`, ids: { trakt: id, slug: `twin-${id}-collection` }, item_ids: { movies: [7, 8] } },
    });
    const request = () =>
      Promise.resolve({ ok: true as const, body: [twin(1, 2), twin(2, 9)], headers: new Headers() });

    expect((await loadFranchiseCatalog({ request })).map(({ id }) => id)).toEqual([2]);
  });

  it('should fail when a page does', async () => {
    const request = (index: number) =>
      Promise.resolve(index === 2 ? { ok: false as const, status: 503 } : page([1], 3));

    await expect(loadFranchiseCatalog({ request })).rejects.toThrow('page 2: 503');
  });

  it('should fail when a page has an unexpected shape', async () => {
    const request = () => Promise.resolve({ ok: true as const, body: { nope: true }, headers: new Headers() });

    await expect(loadFranchiseCatalog({ request })).rejects.toThrow('unexpected shape');
  });
});
