/** The site a rating or votes sort reads, which groups it in a sort menu under its logo. */
export type SortSite = 'trakt' | 'imdb' | 'tmdb' | 'rt' | 'metacritic';

/** A sort in a sort menu. A site's sort, or one in `group: 'mine'`, opens under its row with its `short` name. */
export type MenuSort = {
  readonly by: string;
  readonly label: string;
  readonly site?: SortSite;
  /** Its name under its site or group, without the site ("Votes" for IMDB Votes). */
  readonly short?: string;
  readonly group?: string;
};

/** A row of the sort menu that opens its sorts beside it. */
export type SortFlyout<T extends MenuSort = MenuSort> = {
  readonly key: string;
  readonly label: string;
  readonly sorts: readonly T[];
};

export type SortMenuEntry<T extends MenuSort = MenuSort> =
  | { readonly kind: 'sort'; readonly sort: T }
  | { readonly kind: 'flyout'; readonly flyout: SortFlyout<T> };

/** Each site's name, in the menu's order. */
export const SORT_SITES: readonly (readonly [SortSite, string])[] = [
  ['trakt', 'Trakt'],
  ['imdb', 'IMDb'],
  ['tmdb', 'TMDB'],
  ['rt', 'Rotten Tomatoes'],
  ['metacritic', 'Metacritic'],
];

export const sortSiteName = (site: SortSite | undefined) => SORT_SITES.find(([key]) => key === site)?.[1];

/** Trakt's own community sorts, as the pages without other sites name them. */
const TRAKT: Readonly<Record<string, Pick<MenuSort, 'label' | 'short'>>> = {
  percentage: { label: 'Trakt Percentage', short: 'Percentage' },
  votes: { label: 'Trakt Votes', short: 'Votes' },
  popularity: { label: 'Trakt Popularity', short: 'Popularity' },
};

/** A page's sorts for its menu, Trakt's community ones under the Trakt row. */
export const withTraktSorts = <S extends { readonly by: string; readonly label: string }>(
  sorts: readonly S[],
): (S & Pick<MenuSort, 'site' | 'short'>)[] =>
  sorts.map((sort) => {
    const trakt = TRAKT[sort.by];
    return trakt ? { ...sort, ...trakt, site: 'trakt' } : sort;
  });

const flyout = <T extends MenuSort>(key: string, label: string, sorts: readonly T[]): SortMenuEntry<T>[] =>
  sorts.length > 0 ? [{ kind: 'flyout', flyout: { key, label, sorts } }] : [];

/**
 * A sort menu in sections, a rule between each: the everyday sorts, then one row per site and one for the viewer's
 * own data, each opening its sorts beside it. A row or section with no sorts is left out.
 */
export function sortMenu<T extends MenuSort>(sorts: readonly T[]): readonly (readonly SortMenuEntry<T>[])[] {
  const main = sorts
    .filter((sort) => !sort.site && sort.group !== 'mine')
    .map((sort): SortMenuEntry<T> => ({ kind: 'sort', sort }));
  const sites = SORT_SITES.flatMap(([site, label]) =>
    flyout(
      site,
      label,
      sorts.filter((sort) => sort.site === site),
    ),
  );
  const mine = flyout(
    'mine',
    'My Data',
    sorts.filter((sort) => sort.group === 'mine' && !sort.site),
  );
  return [main, sites, mine].filter((section) => section.length > 0);
}

/** The flyout holding the picked sort, so its row shows it's there. */
export const flyoutHolds = (flyout: SortFlyout, by: string) => flyout.sorts.some((sort) => sort.by === by);
