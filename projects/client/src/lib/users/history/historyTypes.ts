import { genreLabel } from '../../utils/genreLabel.ts';

/** OG's history type dropdown. */
export const historyTypes = {
  all: 'All',
  movies: 'Movies',
  shows: 'Shows',
  episodes: 'Episodes',
} as const;

export type HistoryType = keyof typeof historyTypes;

export const isHistoryType = (value: string): value is HistoryType => Object.hasOwn(historyTypes, value);

// OG's MOVIE_GENRES and TV_GENRES, the genres dropdown's options.
const labelled = (slugs: readonly string[]) => Object.fromEntries(slugs.map((slug) => [slug, genreLabel(slug)]));

const shared = [
  'action',
  'adventure',
  'animation',
  'anime',
] as const;

export const movieGenres: Readonly<Record<string, string>> = labelled([
  ...shared,
  'comedy',
  'crime',
  'documentary',
  'donghua',
  'drama',
  'family',
  'fantasy',
  'history',
  'holiday',
  'horror',
  'music',
  'musical',
  'mystery',
  'romance',
  'science-fiction',
  'short',
  'sporting-event',
  'superhero',
  'suspense',
  'thriller',
  'war',
  'western',
]);

export const tvGenres: Readonly<Record<string, string>> = labelled([
  ...shared,
  'children',
  'comedy',
  'crime',
  'documentary',
  'donghua',
  'drama',
  'family',
  'fantasy',
  'game-show',
  'history',
  'holiday',
  'home-and-garden',
  'horror',
  'music',
  'mystery',
  'news',
  'reality',
  'romance',
  'science-fiction',
  'soap',
  'special-interest',
  'sporting-event',
  'superhero',
  'suspense',
  'talk-show',
  'thriller',
  'war',
  'western',
]);

/** The genres a type filters by. All Types has none. */
export const genresFor = (type: HistoryType) => type === 'movies' ? movieGenres : type === 'all' ? undefined : tvGenres;
