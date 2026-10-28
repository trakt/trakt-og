import { describe, expect, it, vi } from 'vitest';
import { emptyListMembership } from '../../overlay/listMembership.ts';
import { deleteList } from './deleteList.ts';

const membership = {
  ...emptyListMembership(),
  movie: new Map([
    [98, [12]],
    [99, [12, 13]],
  ]),
  lists: new Map([
    [12, { id: 12, name: 'Delete', collaboration: false }],
    [13, { id: 13, name: 'Keep', collaboration: true }],
  ]),
};

describe('deleteList', () => {
  it('should drop the list from every item without reading the other lists', async () => {
    const patch = vi.fn((_name, update) => {
      const next = update(membership);
      expect(next.movie).toEqual(new Map([[99, [13]]]));
      expect([...next.lists.keys()]).toEqual([13]);
      return vi.fn();
    });
    const request = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    const notify = { success: vi.fn(), error: vi.fn() };
    expect(await deleteList({ id: 12, request, overlay: { patch }, remove: () => vi.fn(), notify })).toBe(true);
    expect(patch).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledExactlyOnceWith('/users/me/lists/12', 'DELETE');
  });

  it('should roll back a failed delete', async () => {
    const rollback = vi.fn();
    const restore = vi.fn();
    const patch = vi.fn(() => rollback);
    const request = vi.fn(() => Promise.resolve(new Response(null, { status: 500 })));
    const notify = { success: vi.fn(), error: vi.fn() };
    expect(await deleteList({ id: 12, request, overlay: { patch }, remove: () => restore, notify })).toBe(false);
    expect(rollback).toHaveBeenCalledOnce();
    expect(restore).toHaveBeenCalledOnce();
    expect(notify.error).toHaveBeenCalledOnce();
  });
});
