/**
 * OG's sorts for an item's comments, less the ones the API can't serve:
 * the 30-day sorts and Watched.
 */
export const itemCommentSorts = {
  likes: { label: 'Popular' },
  replies: { label: 'Replies' },
  plays: { label: 'Plays' },
  rating: { label: 'Rating' },
  added: { label: 'Added Date' },
} as const;

export type ItemCommentSortBy = keyof typeof itemCommentSorts;

export type ItemCommentSort = {
  readonly by: ItemCommentSortBy;
  /** OG's `sort_how`: `asc` is the sort's own direction (most, highest, newest first), `desc` flips it. */
  readonly how: 'asc' | 'desc';
  /** The API only reverses rating and added date, so the others never flip. */
  readonly reversible: boolean;
  readonly api: 'likes' | 'replies' | 'plays' | 'highest' | 'lowest' | 'newest' | 'oldest';
};

const isSortBy = (value: string): value is ItemCommentSortBy => Object.hasOwn(itemCommentSorts, value);

/** Reads the `/comments(/:sort_by)?sort_how=` URL. An unknown or cut sort falls back to reactions, like OG's default. */
export function itemCommentSort(sortBy: string | undefined, sortHow: string | null): ItemCommentSort {
  const by = sortBy && isSortBy(sortBy) ? sortBy : 'likes';
  const reversible = by === 'rating' || by === 'added';
  const how = reversible && sortHow === 'desc' ? 'desc' : 'asc';
  const api = by === 'rating'
    ? how === 'asc' ? 'highest' : 'lowest'
    : by === 'added'
    ? how === 'asc' ? 'newest' : 'oldest'
    : by;
  return { by, how, reversible, api };
}

/**
 * OG's `url_for(sort_by:, sort_how:)`: the default sort and direction stay out of the URL. `language` is the comment
 * language's query (`language=pt`), empty for the default.
 */
export function itemCommentsHref(mediaHref: string, by: ItemCommentSortBy, how: 'asc' | 'desc', language = ''): string {
  const query = [how === 'desc' ? 'sort_how=desc' : '', language].filter(Boolean).join('&');
  return `${mediaHref}/comments${by === 'likes' ? '' : `/${by}`}${query ? `?${query}` : ''}`;
}
