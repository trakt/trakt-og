import type { Recommendation, RecommendationSource } from './Recommendation.ts';

type Sample = readonly [
  type: Recommendation['type'],
  id: number,
  slug: string,
  title: string,
  year: number,
  rating: number,
  colors: readonly [string, string],
];

type How = { watched?: boolean; loved?: boolean; stars?: number };

const source =
  (type: RecommendationSource['type'], id: number, slug: string, title: string) =>
  ({ watched = false, loved = false, stars }: How): RecommendationSource => ({
    type,
    id,
    href: `/${type}s/${slug}`,
    title,
    stars,
    watched,
    loved,
  });

const tng = source('show', 1404, 'star-trek-the-next-generation', 'Star Trek: The Next Generation');
const voyager = source('show', 1407, 'star-trek-voyager', 'Star Trek: Voyager');
const wire = source('show', 1395, 'the-wire', 'The Wire');
const heat = source('movie', 16, 'heat-1995', 'Heat');
const alien = source('movie', 432, 'alien-1979', 'Alien');

// The Last of Us shows a title both watched (rated 10) and loved, as one row.
const why: Record<number, Recommendation['why']> = {
  1388: { titles: [wire({ watched: true, stars: 9 })], likes: ['Crime drama', 'Neo-western'] },
  158947: { titles: [alien({ loved: true })], likes: ['Workplace thriller'] },
  120: { titles: [heat({ watched: true, stars: 9 })], likes: [] },
  1: { titles: [], likes: ['Heist', 'Mind-bender', 'Sci-fi action'] },
  154997: {
    titles: [
      tng({ watched: true, loved: true, stars: 10 }),
      voyager({ watched: true, stars: 8 }),
      alien({ loved: true }),
    ],
    likes: ['Post-apocalyptic'],
  },
};

const card = ([type, id, slug, title, year, rating, colors]: Sample): Recommendation => ({
  type,
  id,
  path: `/${type}s/${id}`,
  href: `/${type}s/${slug}`,
  title,
  year,
  overview: `${title} is a public sample for the design demo, with a made-up rating.`,
  released: true,
  rating,
  runtime: type === 'show' ? 50 : 120,
  airedEpisodes: type === 'show' ? 40 : undefined,
  certification: type === 'show' ? 'TV-MA' : 'R',
  genres: ['Drama', 'Thriller'],
  network: type === 'show' ? 'HBO' : undefined,
  colors,
  why: why[id] ?? { titles: [], likes: [] },
});

// Public titles in a mixed, score-like order, with made-up ratings. No artwork, like local OG: the poster colors fill in.
const samples: readonly Sample[] = [
  ['show', 1388, 'breaking-bad', 'Breaking Bad', 2008, 9.2, ['#3d5a2a', '#0f1a0b']],
  ['movie', 120, 'the-dark-knight-2008', 'The Dark Knight', 2008, 8.7, ['#1c2a3d', '#05080d']],
  ['show', 158947, 'severance', 'Severance', 2022, 8.6, ['#2b4f6e', '#0b1620']],
  ['movie', 1, 'inception-2010', 'Inception', 2010, 8.4, ['#5a4632', '#120d08']],
  ['show', 154997, 'the-last-of-us', 'The Last of Us', 2023, 8.7, ['#46503a', '#101309']],
  ['movie', 481, 'the-matrix-1999', 'The Matrix', 1999, 8.5, ['#1f4d2b', '#04100a']],
  ['show', 1395, 'the-wire', 'The Wire', 2002, 9.1, ['#4a3b22', '#100c06']],
  ['movie', 432, 'alien-1979', 'Alien', 1979, 8.3, ['#2d3a33', '#070a08']],
];

/** Four shows and four movies, mixed; each type alone is what its own route would send. */
export const recommendationsFixture = samples.map(card);
