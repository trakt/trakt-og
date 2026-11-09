import type { Franchise } from './Franchise.ts';
import type { FranchiseMovie } from './FranchiseMovie.ts';

type Sample = {
  readonly franchise: Franchise;
  readonly titles: readonly (readonly [title: string, released: string, runtime: number])[];
};

const sample = (id: number, name: string, titles: Sample['titles']): Sample => ({
  franchise: {
    id,
    slug: `${name.toLowerCase().replaceAll(' ', '-')}-collection`,
    name: `${name} Collection`,
    movieIds: titles.map((_, index) => id * 100 + index),
    likeCount: 0,
  },
  titles,
});

// Public franchises with made-up watches, for the specs and the design demo. No artwork, like the show samples.
const samples: readonly Sample[] = [
  sample(9001, 'Alien', [
    ['Alien', '1979-05-25', 117],
    ['Aliens', '1986-07-18', 137],
    ['Alien 3', '1992-05-22', 114],
    ['Alien Resurrection', '1997-11-26', 109],
    ['Prometheus', '2012-06-08', 124],
    ['Alien: Covenant', '2017-05-19', 122],
    ['Alien: Romulus', '2024-08-16', 119],
    ['Untitled Alien Sequel', '2027-08-13', 120],
  ]),
  sample(9002, 'The Matrix', [
    ['The Matrix', '1999-03-31', 136],
    ['The Matrix Reloaded', '2003-05-15', 138],
    ['The Matrix Revolutions', '2003-11-05', 129],
    ['The Matrix Resurrections', '2021-12-22', 148],
  ]),
  sample(9004, 'Spider-Verse', [
    ['Spider-Man: Into the Spider-Verse', '2018-12-14', 117],
    ['Spider-Man: Across the Spider-Verse', '2023-06-02', 140],
    ['Spider-Man: Beyond the Spider-Verse', '2027-06-18', 130],
  ]),
  sample(9003, 'Toy Story', [
    ['Toy Story', '1995-11-22', 81],
    ['Toy Story 2', '1999-11-24', 92],
    ['Toy Story 3', '2010-06-18', 103],
    ['Toy Story 4', '2019-06-21', 100],
  ]),
];

// A flat colored panel in the artwork's ratio with the title on it, so the demo shows posters and fanart offline.
const artwork = (title: string, [width, height]: readonly [number, number], hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="hsl(${hue} 35% 30%)"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="${width / 12}" text-anchor="middle">${title.replaceAll('&', '&amp;')}</text></svg>`,
  )}`;

export const franchiseFixture = {
  now: '2026-09-30T20:00:00.000Z',
  franchises: samples.map(({ franchise }) => franchise),
  movies: (id: number): readonly FranchiseMovie[] =>
    (samples.find(({ franchise }) => franchise.id === id)?.titles ?? []).map(([title, released, runtime], index) => ({
      id: id * 100 + index,
      title,
      year: Number(released.slice(0, 4)),
      href: `/movies/${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
      poster: artwork(title, [200, 300], (id + index * 40) % 360),
      fanart: artwork(title, [1600, 900], (id + index * 40) % 360),
      rating: 6 + ((index * 7) % 30) / 10,
      released,
      runtime,
    })),
  plays: new Map<number, readonly string[]>([
    [900_100, ['2026-06-01T20:00:00.000Z']],
    [900_101, ['2026-08-01T20:00:00.000Z', '2026-09-28T20:00:00.000Z']],
    [900_102, ['2026-09-29T20:00:00.000Z']],
    [900_200, ['2026-09-10T20:00:00.000Z']],
    [900_400, ['2026-09-20T20:00:00.000Z']],
    [900_401, ['2026-09-21T20:00:00.000Z']],
    [900_300, ['2026-01-10T20:00:00.000Z']],
    [900_301, ['2026-01-11T20:00:00.000Z']],
    [900_302, ['2026-01-12T20:00:00.000Z']],
    [900_303, ['2026-01-13T20:00:00.000Z']],
  ]),
};
