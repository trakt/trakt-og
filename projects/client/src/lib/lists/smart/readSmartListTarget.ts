import type { SmartListMediaType, SmartListSource } from './SmartList.ts';

const SOURCES: readonly SmartListSource[] = [
  'trending',
  'popular',
  'anticipated',
  'recommendations',
  'discover',
  'watchlist',
  'library',
];
const MEDIA_TYPES: readonly SmartListMediaType[] = ['movies', 'shows', 'media'];

/**
 * A smart list's source and media type from the API, which types both as plain strings. Anything new reads as all
 * titles of both types, which only its own page can show.
 */
export function readSmartListTarget({ source, media_type }: { source: string; media_type: string }) {
  return {
    source: SOURCES.find((known) => known === source) ?? 'discover',
    mediaType: MEDIA_TYPES.find((known) => known === media_type) ?? 'media',
  };
}
