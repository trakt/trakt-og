import type { FilterOption } from './filterOptions.ts';

const named = (genres: readonly (readonly [string, string])[]): FilterOption[] =>
  genres.map(([value, label]) => ({ value, label }));

/** Both media types' genres, as the API names them. Its `none` stays out: OG never offered it as a filter. */
const shared = named([
  ['action', 'Action'],
  ['adventure', 'Adventure'],
  ['animation', 'Animation'],
  ['anime', 'Anime'],
  ['comedy', 'Comedy'],
  ['crime', 'Crime'],
  ['documentary', 'Documentary'],
  ['donghua', 'Donghua'],
  ['drama', 'Drama'],
  ['family', 'Family'],
  ['fantasy', 'Fantasy'],
  ['history', 'History'],
  ['holiday', 'Holiday'],
  ['horror', 'Horror'],
  ['music', 'Music'],
  ['musical', 'Musical'],
  ['mystery', 'Mystery'],
  ['romance', 'Romance'],
  ['science-fiction', 'Science Fiction'],
  ['short', 'Short'],
  ['sporting-event', 'Sporting Event'],
  ['superhero', 'Superhero'],
  ['suspense', 'Suspense'],
  ['thriller', 'Thriller'],
  ['war', 'War'],
  ['western', 'Western'],
]);

const showsOnly = named([
  ['biography', 'Biography'],
  ['children', 'Children'],
  ['game-show', 'Game Show'],
  ['home-and-garden', 'Home And Garden'],
  ['mini-series', 'Mini Series'],
  ['news', 'News'],
  ['reality', 'Reality'],
  ['soap', 'Soap'],
  ['special-interest', 'Special Interest'],
  ['talk-show', 'Talk Show'],
]);

/** Each media type's genres, alphabetical like the API's lists. */
export const genreOptions: Readonly<Record<'shows' | 'movies', readonly FilterOption[]>> = {
  movies: shared,
  shows: [...shared, ...showsOnly].sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })),
};
