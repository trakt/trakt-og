import { describe, expect, it, vi } from 'vitest';
import type { Franchise } from './Franchise.ts';
import { franchiseCatalogStore } from './franchiseCatalogStore.ts';
import { loadFranchises } from './loadFranchises.ts';

const franchises: readonly Franchise[] = [{ id: 1, slug: 'a-collection', name: 'A', movieIds: [1, 2], likeCount: 4 }];

describe('loadFranchises', () => {
  it('should use the kept catalog without a request', async () => {
    const request = vi.fn();
    const store = { read: () => franchises, write: vi.fn() } as unknown as ReturnType<typeof franchiseCatalogStore>;

    expect(await loadFranchises({ store, request })).toBe(franchises);
    expect(request).not.toHaveBeenCalled();
  });

  it('should read the catalog and keep it when there is none', async () => {
    const write = vi.fn();
    const store = { read: () => null, write } as unknown as ReturnType<typeof franchiseCatalogStore>;
    const request = () =>
      Promise.resolve({
        ok: true as const,
        body: [
          { like_count: 4, list: { name: 'A', ids: { trakt: 1, slug: 'a-collection' }, item_ids: { movies: [1, 2] } } },
        ],
        headers: new Headers(),
      });

    expect(await loadFranchises({ store, request })).toEqual(franchises);
    expect(write).toHaveBeenCalledWith(franchises);
  });
});
