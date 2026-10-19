import type { CommentItem } from '../CommentItem.ts';

// The episode or season part OG adds to a title: ' 1x01 "Pilot"', ' Season 2'.
const PART = /\s+(?:\d+x\d+\b|Season \d+\b).*$/;

/**
 * What the GIF picker shows before anything's typed: GIFs for the movie or show the comment is about, its own title
 * without the season or episode part. Nothing for lists, whose names rarely make a GIF search.
 */
export function gifQueryOf(item: CommentItem | undefined): string | undefined {
  if (!item || item.type === 'list') return undefined;
  return item.title.replace(PART, '').trim() || undefined;
}
