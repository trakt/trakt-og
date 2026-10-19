/**
 * OG's list types for an item's lists page, keyed by OG's URL segment, with `api` the worker's name for each. OG's
 * Watchlists and Favorites are left out until the API serves them: it answers both with no lists. Me is the signed-in
 * viewer's own lists with the item, which come from `/listed` instead.
 */
export const itemListTypes = {
  all: { label: 'All Lists', api: 'all' },
  personal: { label: 'Personal Lists', api: 'personal' },
  official: { label: 'Official Lists', api: 'official' },
  me: { label: 'Me', api: 'listed' },
} as const;

/** OG's sorts, less the 30-day ones the API can't serve. */
export const itemListSorts = {
  popularity: { label: 'Popularity', api: 'popular' },
  likes: { label: 'Reactions', api: 'likes' },
  comments: { label: 'Comments', api: 'comments' },
  items: { label: 'Items', api: 'items' },
  added: { label: 'Added Date', api: 'added' },
  updated: { label: 'Updated Date', api: 'updated' },
} as const;

export type ItemListType = keyof typeof itemListTypes;
export type ItemListSortBy = keyof typeof itemListSorts;

export type ItemListQuery = { readonly type: ItemListType; readonly sortBy: ItemListSortBy };

const isType = (value: string): value is ItemListType => Object.hasOwn(itemListTypes, value);
const isSortBy = (value: string): value is ItemListSortBy => Object.hasOwn(itemListSorts, value);

/**
 * Reads the `/lists(/:type)(/:sort_by)` segments like OG: no type is Personal Lists, an unknown one is All Lists, and
 * an unknown or cut sort is Popularity.
 */
export function itemListQuery(type: string | undefined, sortBy: string | undefined): ItemListQuery {
  return {
    type: type === undefined ? 'personal' : isType(type) ? type : 'all',
    sortBy: sortBy && isSortBy(sortBy) ? sortBy : 'popularity',
  };
}

/** The lists page for a type and sort. The defaults stay out of the URL, and the sort needs the type before it. */
export function itemListsHref(mediaHref: string, { type, sortBy }: ItemListQuery): string {
  if (sortBy !== 'popularity') return `${mediaHref}/lists/${type}/${sortBy}`;
  return type === 'personal' ? `${mediaHref}/lists` : `${mediaHref}/lists/${type}`;
}
