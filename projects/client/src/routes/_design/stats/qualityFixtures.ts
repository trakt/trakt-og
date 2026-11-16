import type { QualityRead } from '#lib/stats/QualityRead.ts';
import { toQualityChart } from '#lib/stats/toQualityChart.ts';

const now = new Date('2026-11-01T00:00:00Z');

const seasonRatings = [
  [8.9, 52_410],
  [8.8, 47_882],
  [9.0, 46_730],
  [9.1, 44_901],
  [8.7, 43_118],
  [8.9, 41_760],
  [8.5, 40_229],
  [5.9, 38_954],
];

const seasons: QualityRead = {
  type: 'show',
  seasons: [
    { number: 0, ids: { trakt: 3990 }, rating: 7.4, votes: 812, aired_episodes: 9 },
    ...seasonRatings.map(([rating = 0, votes = 0], i) => ({
      number: i + 1,
      ids: { trakt: 3991 + i },
      rating,
      votes,
      aired_episodes: i === 7 ? 6 : 10,
    })),
  ],
};

const titles = [
  'Winterfell',
  'A Knight of the Seven Kingdoms',
  'The Long Night',
  'The Last of the Starks',
  'The Bells',
  'The Iron Throne',
];

const episodes = (rows: readonly (readonly [number, number])[]): QualityRead => ({
  type: 'season',
  season: 8,
  episodes: rows.map(([rating, votes], i) => ({
    season: 8,
    number: i + 1,
    title: titles[i],
    ids: { trakt: 73_900 + i },
    rating,
    votes,
    first_aired: new Date(Date.UTC(2019, 3, 14 + i * 7)).toISOString(),
  })),
});

const episodeRows = [
  [7.9, 9_100],
  [7.6, 8_730],
  [7.9, 8_411],
  [5.8, 8_062],
  [5.4, 7_944],
  [4.6, 7_801],
] as const;

export const showChart = toQualityChart({ read: seasons, href: '/shows/game-of-thrones', now });

export const seasonChart = toQualityChart({
  read: episodes(episodeRows),
  href: '/shows/game-of-thrones/seasons/8',
  reference: { percent: 59 },
  now,
});

export const gapChart = toQualityChart({
  read: episodes([
    [8.1, 220],
    [7.4, 163],
    [7.7, 4],
    [7.2, 91],
    [6.9, 6],
    [7.5, 58],
  ]),
  href: '/shows/game-of-thrones/seasons/8',
  reference: { percent: 74 },
  now,
});

export const showYou = [90, 90, 100, 100, 90, 80, 70, 40];
export const seasonYou = [80, 80, 70, null, 40, 30];
export const seasonImdb = {
  percents: [76, 83, 75, 64, 61, 40],
  votes: [148_211, 136_520, 248_771, 181_349, 236_918, 300_174],
};
export const seasonTmdb = { percents: [82, 85, 79, 68, 63, 52], votes: [612, 538, 801, 455, 497, 479] };
