import type { ListItemSort, ListSortGroup } from './listItemSorts.ts';

const ORDER: readonly ListSortGroup[] = ['main', 'site', 'votes', 'mine'];
const HEADERS: Readonly<Record<ListSortGroup, string | undefined>> = {
  main: undefined,
  site: 'Site Ratings',
  votes: 'Votes',
  mine: 'Your data',
};

/** A list page's sort menu in its sections, each after a rule and under its header; the first has none. */
export const listSortGroups = (sorts: readonly ListItemSort[]) =>
  ORDER.map((group) => ({ group, header: HEADERS[group], sorts: sorts.filter((sort) => sort.group === group) })).filter(
    (group) => group.sorts.length > 0,
  );
