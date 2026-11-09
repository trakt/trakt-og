/** The franchise sorts, in the menu's order, each with the direction it opens in. */
export const franchiseSorts = {
  recent: { label: 'Recently Watched', how: 'desc' },
  percent: { label: 'Percent Watched', how: 'desc' },
  left: { label: 'Movies Left', how: 'asc' },
  title: { label: 'Title', how: 'asc' },
} as const;

export type FranchiseSortBy = keyof typeof franchiseSorts;

export type FranchiseSort = { readonly by: FranchiseSortBy; readonly how: 'asc' | 'desc' };

export const isFranchiseSortBy = (value: string): value is FranchiseSortBy => Object.hasOwn(franchiseSorts, value);

/** The URL's `sort_by/sort_how` rest as a literal order; an unknown name or none is Recently Watched. */
export function readFranchiseSort(segments: string | undefined): FranchiseSort {
  const [by = '', how] = (segments ?? '').split('/');
  if (!isFranchiseSortBy(by)) return { by: 'recent', how: franchiseSorts.recent.how };
  return { by, how: how === 'asc' || how === 'desc' ? how : franchiseSorts[by].how };
}
