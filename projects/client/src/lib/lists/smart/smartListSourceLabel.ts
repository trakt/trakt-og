import type { SmartListMediaType, SmartListSource } from './SmartList.ts';

const SOURCES: Record<SmartListSource, string> = {
  trending: 'Trending',
  popular: 'Popular',
  anticipated: 'Anticipated',
  recommendations: 'Recommendations',
  discover: 'All titles',
  watchlist: 'Watchlist',
  library: 'Library',
};

const TYPES: Record<SmartListMediaType, string> = { shows: 'shows', movies: 'movies', media: 'shows and movies' };

/** Where a smart list's titles come from, "Trending", or with its type, "Trending shows". */
export const smartListSourceLabel = (source: SmartListSource, mediaType?: SmartListMediaType) =>
  mediaType ? `${SOURCES[source]} ${TYPES[mediaType]}` : SOURCES[source];
