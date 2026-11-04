import type { ListItemSort, ListSortSite } from './listItemSorts.ts';

/** A row of the sort menu that opens its sorts beside it, named without the site ("Votes" under IMDb). */
export type ListSortFlyout = { readonly key: string; readonly label: string; readonly sorts: readonly ListItemSort[] };

export type ListSortMenuEntry =
  | { readonly kind: 'sort'; readonly sort: ListItemSort }
  | { readonly kind: 'flyout'; readonly flyout: ListSortFlyout };

/** Each site's name, in the menu's order. */
export const LIST_SORT_SITES: readonly (readonly [ListSortSite, string])[] = [
  ['trakt', 'Trakt'],
  ['imdb', 'IMDb'],
  ['tmdb', 'TMDB'],
  ['rt', 'Rotten Tomatoes'],
  ['metacritic', 'Metacritic'],
];

const flyout = (key: string, label: string, sorts: readonly ListItemSort[]): ListSortMenuEntry[] =>
  sorts.length > 0 ? [{ kind: 'flyout', flyout: { key, label, sorts } }] : [];

/**
 * A list page's sort menu in sections, a rule between each: the everyday sorts, then one row per site and one for the
 * viewer's own data, each opening its sorts beside it. A row or section with no sorts is left out.
 */
export function listSortMenu(sorts: readonly ListItemSort[]): readonly (readonly ListSortMenuEntry[])[] {
  const main = sorts.filter((sort) => sort.group === 'main').map((sort): ListSortMenuEntry => ({ kind: 'sort', sort }));
  const sites = LIST_SORT_SITES.flatMap(([site, label]) =>
    flyout(
      site,
      label,
      sorts.filter((sort) => sort.site === site),
    ),
  );
  const mine = flyout(
    'mine',
    'My Data',
    sorts.filter((sort) => sort.group === 'mine'),
  );
  return [main, sites, mine].filter((section) => section.length > 0);
}

/** The flyout holding the picked sort, so its row shows it's there. */
export const flyoutHolds = (flyout: ListSortFlyout, by: string) => flyout.sorts.some((sort) => sort.by === by);
