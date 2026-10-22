/** The hand-picked titles whose fanart fills the home page's hero, shuffled on every visit. */
export const homeFanartTitles = [
  { type: 'show', slug: 'breaking-bad' },
  { type: 'show', slug: 'fringe' },
  { type: 'show', slug: 'mr-robot' },
  { type: 'show', slug: 'battlestar-galactica-2004' },
  { type: 'show', slug: 'severance' },
  { type: 'show', slug: 'stranger-things' },
  { type: 'show', slug: 'superstore' },
  { type: 'movie', slug: 'tron-legacy-2010' },
  { type: 'movie', slug: 'the-dark-knight-2008' },
  { type: 'movie', slug: 'the-social-network-2010' },
  { type: 'movie', slug: 'the-goonies-1985' },
  { type: 'movie', slug: 'ready-player-one-2018' },
  { type: 'movie', slug: 'mad-max-fury-road-2015' },
  { type: 'movie', slug: 'the-empire-strikes-back-1980' },
] as const satisfies ReadonlyArray<{ type: 'movie' | 'show'; slug: string }>;
