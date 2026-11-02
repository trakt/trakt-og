const labels: Readonly<Record<string, string>> = {
  query: 'Title',
  watchnow: 'Streaming',
  genres: 'Genres',
  certifications: 'Certifications',
  languages: 'Languages',
  countries: 'Countries',
  networks: 'Networks',
  episode_types: 'Episodes',
  status: 'Status',
  years: 'Released',
  runtimes: 'Runtime',
  ratings: 'Trakt',
  imdb_ratings: 'IMDb',
  tmdb_ratings: 'TMDB',
  rt_meters: 'Tomatometer',
  rt_user_meters: 'Audience',
  letterboxd_ratings: 'Letterboxd',
  mal_ratings: 'MyAnimeList',
  parental: 'Parental Guide',
};

/** What a filter chip filters, from its `filterTags` id ("genres" is Genres, "runtimes" is Runtime). */
export const filterTagLabel = (id: string): string => labels[id] ?? '';
