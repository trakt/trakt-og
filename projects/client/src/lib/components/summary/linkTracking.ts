const MEDIA_TARGETS: Readonly<Record<string, string>> = {
  'Official Site': 'homepage',
  IMDB: 'imdb-media',
  TMDB: 'tmdb-media',
  Wikipedia: 'wikipedia',
  Twitter: 'x',
  Facebook: 'facebook',
  Instagram: 'instagram',
};

// Web's person page links out to IMDb as `imdb` and has no TMDB link.
const PERSON_TARGETS: Readonly<Record<string, string | undefined>> = {
  ...MEDIA_TARGETS,
  IMDB: 'imdb',
  TMDB: undefined,
};

/** Web's `action.link` for a summary's link out, by its label; none for a site web doesn't link to (JustWatch, TVDB). */
export function toLinkTracking(label: string, person: boolean): { source: string; target: string } | undefined {
  const target = (person ? PERSON_TARGETS : MEDIA_TARGETS)[label];
  return target ? { source: person ? 'person-summary' : 'media-links', target } : undefined;
}

/** Web's `action.share` source for a summary's share button, from the item's path. */
export function toShareTracking(href: string): { source: string; type?: string } {
  const [kind, , seasons, , episodes] = href.split('/').slice(1);
  if (kind === 'people') return { source: 'person' };
  if (kind === 'movies') return { source: 'media', type: 'movie' };
  if (episodes) return { source: 'episode' };
  if (seasons) return { source: 'season' };
  return { source: 'media', type: 'show' };
}
