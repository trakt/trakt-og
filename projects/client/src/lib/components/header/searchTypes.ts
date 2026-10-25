/**
 * The header search's type picker, in OG's order without Episodes and Users. `slug` is OG's `data-type`: the
 * form posts to `/search/<slug>` and the `search_type` cookie stores it. `text` is the `/search/:type` the
 * autocomplete asks, `idType` the `/search/:id_type/:id` lookup.
 */
export const searchTypes = [
  { slug: '', label: 'Shows & Movies', text: 'movie,show' },
  { slug: 'shows', label: 'Shows', text: 'show' },
  { slug: 'movies', label: 'Movies', text: 'movie' },
  { slug: 'people', label: 'People', text: 'person' },
  { slug: 'lists', label: 'Lists', text: 'list' },
  { slug: 'trakt', label: 'Trakt ID', idType: 'trakt', divider: true },
  { slug: 'imdb', label: 'IMDB ID', idType: 'imdb' },
  { slug: 'tmdb', label: 'TMDB ID', idType: 'tmdb' },
  { slug: 'tvdb', label: 'TVDB ID', idType: 'tvdb' },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  text?: 'movie,show' | 'show' | 'movie' | 'person' | 'list';
  idType?: string;
  divider?: boolean;
}>;
