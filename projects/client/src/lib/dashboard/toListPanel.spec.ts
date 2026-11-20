import { describe, expect, it, vi } from 'vitest';
import type { ListItems } from '../lists/loadListItems.ts';
import type { ListSort } from '../lists/resolveListSort.ts';
import { readPanelItems } from './toListPanel.ts';

const pageOf = (total: number) => (page: number, limit: number) =>
  Promise.resolve<ListItems>({
    status: 200,
    headers: new Headers({ 'x-pagination-item-count': `${total}` }),
    rows: Array.from({ length: Math.max(0, Math.min(limit, total - (page - 1) * limit)) }, (_, i) => ({
      id: (page - 1) * limit + i,
    })) as unknown as ListItems['rows'],
  });

describe('readPanelItems', () => {
  it('should read the first 18 items without hides', async () => {
    const read = vi.fn(pageOf(600));
    const { items, scope } = await readPanelItems({ read, hiding: false });
    expect(scope).toBe('first');
    expect(items.rows).toHaveLength(18);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('should read every page with hides', async () => {
    const read = vi.fn(pageOf(600));
    const sort: ListSort = { by: 'added', how: 'desc' };
    const { items, scope } = await readPanelItems({ read, sort, hiding: true });
    expect(scope).toBe('whole');
    expect(items.rows).toHaveLength(600);
    expect(read.mock.calls).toEqual([
      [1, 250, sort],
      [2, 250, sort],
      [3, 250, sort],
    ]);
  });

  it('should keep the first 18 of a list too long to hide', async () => {
    const read = vi.fn(pageOf(6000));
    const { items, scope } = await readPanelItems({ read, hiding: true });
    expect(scope).toBe('tooLong');
    expect(items.rows).toHaveLength(18);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('should read a random sort ranked', async () => {
    const read = vi.fn(pageOf(10));
    const { items } = await readPanelItems({ read, sort: { by: 'random', how: 'asc' }, hiding: true });
    expect(read).toHaveBeenCalledWith(1, 250, { by: 'rank', how: 'asc' });
    expect(items.rows).toHaveLength(10);
  });
});
