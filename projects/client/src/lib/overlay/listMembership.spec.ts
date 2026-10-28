import { describe, expect, it } from 'vitest';
import {
  emptyListMembership,
  listsOf,
  toListMembership,
  withItemLists,
  withListItems,
  withoutList,
} from './listMembership.ts';

const faves = { id: 1, name: 'Faves', collaboration: false };
const shared = { id: 2, name: 'Shared', collaboration: true };
const data = toListMembership([
  {
    ...faves,
    items: [
      { type: 'movie', id: 10 },
      { type: 'person', id: 5 },
    ],
  },
  {
    ...shared,
    items: [
      { type: 'movie', id: 10 },
      { type: 'episode', id: 20 },
      { type: 'movie', id: 10 },
    ],
  },
]);

describe('listMembership', () => {
  it('should map every item to its lists once and leave people out', () => {
    expect(data.movie).toEqual(new Map([[10, [1, 2]]]));
    expect(data.episode).toEqual(new Map([[20, [2]]]));
    expect(listsOf(data, 'movie', 10)).toEqual([faves, shared]);
    expect(listsOf(data, 'show', 10)).toEqual([]);
  });

  it('should add to and take off one list, naming a new list', () => {
    const picked = { id: 3, name: 'New', collaboration: false, owner: 'me' };
    const added = withListItems(data, { list: picked, items: [{ type: 'movie', id: 10 }], add: true });
    expect(listsOf(added, 'movie', 10).map(({ name }) => name)).toEqual(['Faves', 'Shared', 'New']);
    expect(added.lists.get(3)).toEqual({ id: 3, name: 'New', collaboration: false });

    const removed = withListItems(data, { list: shared, items: [{ type: 'episode', id: 20 }], add: false });
    expect(removed.episode.has(20)).toBe(false);
    expect(data.episode.has(20)).toBe(true);
  });

  it('should set one item from the picker and take its fresh names', () => {
    const next = withItemLists(data, {
      type: 'movie',
      id: 10,
      selected: [2],
      lists: [{ ...faves, name: 'Renamed' }, shared],
    });
    expect(listsOf(next, 'movie', 10)).toEqual([shared]);
    expect(next.lists.get(1)?.name).toBe('Renamed');
    expect(withItemLists(next, { type: 'movie', id: 10, selected: [], lists: [] }).movie.has(10)).toBe(false);
  });

  it('should drop a deleted list from every item', () => {
    const next = withoutList(data, 2);
    expect(next.movie).toEqual(new Map([[10, [1]]]));
    expect(next.episode.size).toBe(0);
    expect(next.lists.has(2)).toBe(false);
  });

  it('should start empty', () => {
    expect(listsOf(emptyListMembership(), 'movie', 1)).toEqual([]);
  });
});
