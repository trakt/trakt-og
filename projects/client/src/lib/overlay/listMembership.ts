import type { ListLabel } from './ListLabel.ts';
import type { OverlaySlices } from './OverlaySlices.ts';

type Membership = OverlaySlices['listMembership'];
type ItemType = 'movie' | 'show' | 'season' | 'episode';
type Item = { type: string; id: number };

const TYPES = ['movie', 'show', 'season', 'episode'] as const;

export const emptyListMembership = (): Membership => ({
  movie: new Map(),
  show: new Map(),
  season: new Map(),
  episode: new Map(),
  lists: new Map(),
});

/** The slice from every list and the items on it. People and other rows are left out. */
export function toListMembership(lists: readonly (ListLabel & { items: readonly Item[] })[]): Membership {
  const data = emptyListMembership();
  const add = (type: ItemType, id: number, list: number) =>
    (data[type] as Map<number, number[]>).set(id, [...(data[type].get(id) ?? []), list]);
  for (const { items, ...list } of lists) {
    (data.lists as Map<number, ListLabel>).set(list.id, list);
    for (const item of items) {
      const type = TYPES.find((name) => name === item.type);
      if (type && !data[type].get(item.id)?.includes(list.id)) add(type, item.id, list.id);
    }
  }
  return data;
}

/** Adds items to one list, or takes them off it. A list it doesn't know yet joins `lists` at the end. */
export function withListItems(
  data: Membership,
  { list, items, add }: { list: ListLabel | { id: number }; items: readonly Item[]; add: boolean },
): Membership {
  const next = { ...data };
  for (const type of TYPES) {
    const ids = items.filter((item) => item.type === type).map((item) => item.id);
    if (!ids.length) continue;
    const map = new Map(data[type]);
    for (const id of ids) {
      const rest = (map.get(id) ?? []).filter((listId) => listId !== list.id);
      const lists = add ? [...rest, list.id] : rest;
      if (lists.length) map.set(id, lists);
      else map.delete(id);
    }
    next[type] = map;
  }
  if ('name' in list && !data.lists.has(list.id)) {
    const { id, name, collaboration } = list;
    next.lists = new Map([...data.lists, [id, { id, name, collaboration }]]);
  }
  return next;
}

/** One item's lists, as the picker just read them, with the picker's fresh names for every list. */
export function withItemLists(
  data: Membership,
  {
    type,
    id,
    selected,
    lists,
  }: { type: ItemType; id: number; selected: readonly number[]; lists: readonly ListLabel[] },
): Membership {
  const map = new Map(data[type]);
  if (selected.length) map.set(id, [...selected]);
  else map.delete(id);
  return { ...data, [type]: map, lists: new Map(lists.map((list) => [list.id, list])) };
}

/** A deleted list leaves every item it held. */
export function withoutList(data: Membership, listId: number): Membership {
  const next = { ...data, lists: new Map(data.lists) };
  next.lists.delete(listId);
  for (const type of TYPES) {
    next[type] = new Map(
      [...data[type]].flatMap(([id, lists]) => {
        const rest = lists.filter((list) => list !== listId);
        return rest.length ? [[id, rest] as const] : [];
      }),
    );
  }
  return next;
}

/** The named lists holding one item, in the slice's list order. */
export function listsOf(data: Membership, type: ItemType, id: number): readonly ListLabel[] {
  const ids = data[type].get(id);
  return ids ? [...data.lists.values()].filter((list) => ids.includes(list.id)) : [];
}
