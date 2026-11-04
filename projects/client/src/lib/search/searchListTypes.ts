/**
 * The Lists tab's Type choices for an empty search, keyed by the `?type=` value, labelled like an item's lists page,
 * with the page's title for each. All is the default, so its link leaves `type` out.
 */
export const searchListTypes = [
  { value: 'all', label: 'All Lists', title: 'Popular Lists' },
  { value: 'personal', label: 'Personal Lists', title: 'Popular Personal Lists' },
  { value: 'official', label: 'Official Lists', title: 'Popular Official Lists' },
] as const;

export type SearchListType = (typeof searchListTypes)[number]['value'];
