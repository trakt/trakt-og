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
  rt_meters: 'Tomatometer',
  rt_user_meters: 'Audience',
};

/** What a filter chip filters, from its `filterTags` id ("genres-drama" is Genres, "runtimes" is Runtime). */
export function filterTagLabel(id: string): string {
  const key = Object.keys(labels)
    .filter((name) => id === name || id.startsWith(`${name}-`))
    .toSorted((a, b) => b.length - a.length)
    .at(0);
  return key ? labels[key] ?? '' : '';
}
