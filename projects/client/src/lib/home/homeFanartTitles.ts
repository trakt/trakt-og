/** The hand-picked titles whose fanart fills the home page's hero, shuffled on every visit. */
export const homeFanartTitles = [
  { type: 'show', slug: 'breaking-bad' },
  { type: 'show', slug: 'fringe' },
  { type: 'show', slug: 'mr-robot' },
  { type: 'show', slug: 'battlestar-galactica-2004' },
  { type: 'show', slug: 'severance' },
  { type: 'movie', slug: 'tron-legacy-2010' },
  { type: 'movie', slug: 'rogue-one-a-star-wars-story-2016' },
  { type: 'movie', slug: 'the-social-network-2010' },
  { type: 'movie', slug: 'the-goonies-1985' },
  { type: 'movie', slug: 'ready-player-one-2018' },
] as const satisfies ReadonlyArray<{ type: 'movie' | 'show'; slug: string }>;
