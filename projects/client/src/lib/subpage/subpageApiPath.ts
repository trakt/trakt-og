import type { SubpageItem } from './SubpageItem.ts';

/** A subpage item's API path, for the reads under it: `/shows/the-bear/seasons/2/episodes/7`. */
export function subpageApiPath(item: SubpageItem): string {
  const show = `/shows/${encodeURIComponent(item.id)}`;
  if (item.type === 'movie') return `/movies/${encodeURIComponent(item.id)}`;
  if (item.type === 'show') return show;
  const season = `${show}/seasons/${encodeURIComponent(item.season)}`;
  return item.type === 'season' ? season : `${season}/episodes/${encodeURIComponent(item.episode)}`;
}
