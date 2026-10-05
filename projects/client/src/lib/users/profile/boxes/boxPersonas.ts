import type { UserStatsResponse } from '@trakt/api';
import type { ProfileUser } from '../../ProfileUser.ts';
import type { WatchedGenreRow } from '../watchedGenresSchema.ts';
import type { BoxInput } from './BoxInput.ts';
import { boxExtraLoader } from './boxExtraLoader.ts';
import { boxMath } from './boxMath.ts';

/**
 * Four made-up users for the box specs and the design page: a binge TV watcher, a movie buff who rates everything, a
 * list curator and a brand-new user. Titles and images are real; the activity is not.
 */

const NOW = '2026-10-05T12:00:00.000Z';
const TODAY = boxMath.utcDay(NOW);
const DAY = 86_400_000;

const at = (daysAgo: number, hour = 20) => new Date((TODAY - daysAgo) * DAY + hour * 3_600_000).toISOString();

type Kind = 'shows' | 'movies';
const media = (kind: Kind, trakt: number, slug: string, title: string, year: number, art: string) => {
  const [fanart, poster] = art.split(' ');
  const path = `media.trakt.tv/images/${kind}/${
    String(trakt).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1/$2/$3')
  }`;
  return {
    ids: { trakt, slug },
    title,
    year,
    runtime: kind === 'shows' ? 45 : 120,
    genres: [],
    images: {
      fanart: [`${path}/fanarts/medium/${fanart}.jpg.webp`],
      poster: [`${path}/posters/medium/${poster}.jpg.webp`],
    },
  };
};

const severance = media('shows', 154997, 'severance', 'Severance', 2022, '9400ecb8e2 f60ddb06de');
const shogun = media('shows', 170054, 'shogun-2024', 'Shōgun', 2024, '5295f531e4 6c986db7d0');
const slowHorses = media('shows', 155534, 'slow-horses', 'Slow Horses', 2022, '631e5c2683 6b6d40b6de');
const thePitt = media('shows', 232884, 'the-pitt', 'The Pitt', 2025, '83c378f8a1 f45f3b3c1f');
const theBear = media('shows', 189717, 'the-bear', 'The Bear', 2022, '59290b738d ef28e34e51');
const pluribus = media('shows', 206790, 'pluribus', 'Pluribus', 2025, '27e7ef3b00 e255ecc15c');
const theThing = media('movies', 843, 'the-thing-1982', 'The Thing', 1982, '12e0dff3af aec9f68dac');
const alien = media('movies', 295, 'alien-1979', 'Alien', 1979, '8dc868d676 42faf18edc');
const duneTwo = media('movies', 537449, 'dune-part-two-2024', 'Dune: Part Two', 2024, 'b7e56e851f 2acc44f507');
const dune = media('movies', 287071, 'dune-2021', 'Dune', 2021, '4257cce705 ac59f28ad6');
const arrival = media('movies', 210803, 'arrival-2016', 'Arrival', 2016, '00dd6427c9 fc306afd42');
const sicario = media('movies', 171369, 'sicario-2015', 'Sicario', 2015, '06c19bf336 a3938a03db');
const sinners = media('movies', 997581, 'sinners-2025', 'Sinners', 2025, 'cbebc553c1 5f2fd22691');
const weapons = media('movies', 867094, 'weapons-2025', 'Weapons', 2025, '61b76e51d4 70d5a3734e');
const nosferatu = media('movies', 808857, 'nosferatu-2024', 'Nosferatu', 2024, '0c8cd6c840 b1fde04511');

type Show = typeof severance;
type Movie = typeof theThing;

const episodePlay = (show: Show, daysAgo: number, season = 1, number = 1, title: string | null = null) => ({
  watched_at: at(daysAgo),
  show,
  episode: { ids: { trakt: show.ids.trakt * 1000 + season * 100 + number }, season, number, title, runtime: 45 },
});
const moviePlay = (movie: Movie, daysAgo: number) => ({ watched_at: at(daysAgo), movie });

/** Episodes per day for the last 30 days, oldest first, cycling through `shows`. */
const episodesByDay = (perDay: string, shows: readonly Show[]) =>
  perDay.split(' ').map(Number).flatMap((count, i) =>
    Array.from({ length: count }, (_, n) => episodePlay(shows[(i + n) % shows.length] ?? severance, 29 - i))
  );

const stats = (
  { episodes, movies, ratings = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }: {
    episodes: { plays: number; watched: number; hours: number };
    movies: { plays: number; watched: number };
    /** How many 1s to 10s. */
    ratings?: readonly [number, number, number, number, number, number, number, number, number, number];
  },
): UserStatsResponse => ({
  movies: {
    plays: movies.plays,
    watched: movies.watched,
    minutes: movies.plays * 115,
    collected: 0,
    ratings: 0,
    comments: 0,
  },
  shows: { watched: Math.ceil(episodes.watched / 30), collected: 0, ratings: 0, comments: 0 },
  seasons: { ratings: 0, comments: 0 },
  episodes: {
    plays: episodes.plays,
    watched: episodes.watched,
    minutes: episodes.hours * 60,
    collected: 0,
    ratings: 0,
    comments: 0,
  },
  network: { friends: 0, followers: 0, following: 0 },
  ratings: {
    total: ratings.reduce((sum, count) => sum + count, 0),
    distribution: {
      1: ratings[0],
      2: ratings[1],
      3: ratings[2],
      4: ratings[3],
      5: ratings[4],
      6: ratings[5],
      7: ratings[6],
      8: ratings[7],
      9: ratings[8],
      10: ratings[9],
    },
  },
  progress: { started: 0, finished: 0, dropped: 0 },
  lists: 0,
  total_minutes: episodes.hours * 60 + movies.plays * 115,
  total_plays: episodes.plays + movies.plays,
});

const profile = (
  slug: string,
  { about = null, joinedAt, location, vipYears = 0 }: {
    about?: string | null;
    joinedAt: string;
    location: string;
    vipYears?: number;
  },
): ProfileUser => ({
  slug,
  username: slug,
  displayName: slug.charAt(0).toUpperCase() + slug.slice(1),
  firstName: slug.charAt(0).toUpperCase() + slug.slice(1),
  avatarUrl: 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png',
  isPrivate: false,
  isLocked: false,
  vip: vipYears > 0 ? { kind: 'vip', tag: null, years: vipYears } : null,
  location,
  gender: { icon: 'genderless', title: 'Unknown' },
  age: null,
  about,
  joinedAt,
  coverUrl: null,
});

const genres = (name: string): readonly WatchedGenreRow[] => [{
  play_count: 100,
  genre: { slug: name.toLowerCase().replace(' ', '-'), name },
  percentage: 30,
  percentage_row: 100,
  movies: { play_count: 0, ids: [] },
  shows: { play_count: 0, ids: [] },
  episodes: { play_count: 0, ids: [] },
}];

const watchlist = (count: number, rows: readonly ({ show: Show } | { movie: Movie })[]) => ({ count, rows });

/** One show's progress row, as `/users/:id/progress/watched/added/desc` returns it. */
const progress = (show: Show, completed: number, aired: number, daysAgo: number) => ({
  show: { ids: show.ids, title: show.title },
  progress: { aired, completed, last_watched_at: at(daysAgo) },
});

type Persona = {
  readonly id: string;
  readonly label: string;
  readonly input: BoxInput;
  /** The boxes' extra requests, answered from the persona's data. */
  readonly extras: () => ReturnType<typeof boxExtraLoader>;
};

const answering = (id: string, rows: { progress: readonly unknown[] }) => () =>
  boxExtraLoader({
    fetch: (request) => {
      const url = new URL(request instanceof Request ? request.url : request.toString());
      return Promise.resolve(Response.json(url.pathname.includes('/progress/watched') ? rows.progress : []));
    },
    token: null,
    id,
  });

const maya = ((): Persona => {
  const latest = episodePlay(severance, 0, 2, 9, 'The After Hours');
  const recent = episodesByDay(
    '3 2 0 5 8 12 14 2 1 0 3 4 10 12 3 2 3 0 5 14 16 2 2 4 0 6 12 14 3 1',
    [severance, slowHorses, thePitt, pluribus],
  );
  return {
    id: 'maya',
    label: 'Binge TV watcher',
    input: {
      profile: profile('maya', { joinedAt: '2019-06-14T10:00:00.000Z', location: 'Leeds' }),
      stats: stats({ episodes: { plays: 3_600, watched: 3_410, hours: 2_360 }, movies: { plays: 75, watched: 72 } }),
      isSelf: false,
      today: TODAY,
      latest: { episode: latest, movie: moviePlay(dune, 12) },
      recent: { episodes: [...recent, latest], movies: [moviePlay(dune, 12)] },
      watchlist: watchlist(34, [{ show: thePitt }, { show: slowHorses }, { show: pluribus }]),
      genres: genres('Drama'),
    },
    extras: answering('maya', { progress: [progress(severance, 18, 19, 0), progress(slowHorses, 30, 33, 6)] }),
  };
})();

const dex = ((): Persona => {
  const horror = [theThing, alien, sinners, weapons, nosferatu];
  const movies = [1, 4, 5, 7, 9, 11, 12, 15, 17, 19, 20, 22, 24, 27, 29].map((daysAgo, i) =>
    moviePlay(horror[i % horror.length] ?? theThing, daysAgo)
  );
  const latest = moviePlay(theThing, 1);
  return {
    id: 'dex',
    label: 'Movie buff and rater',
    input: {
      profile: profile('dex', {
        about:
          'Letterboxd refugee. I rate everything, even the bad ones. 31 days of horror every October, no exceptions.',
        joinedAt: '2014-03-02T10:00:00.000Z',
        location: 'Austin, TX',
        vipYears: 9,
      }),
      stats: stats({
        episodes: { plays: 600, watched: 560, hours: 400 },
        movies: { plays: 3_100, watched: 2_840 },
        ratings: [14, 22, 48, 96, 180, 310, 520, 610, 360, 150],
      }),
      isSelf: false,
      today: TODAY,
      latest: { episode: episodePlay(theBear, 6, 3, 4), movie: latest },
      recent: {
        episodes: episodesByDay('0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 0 0 0 0', [theBear]),
        movies,
      },
      watchlist: watchlist(140, [{ movie: sinners }, { movie: weapons }, { movie: nosferatu }]),
      genres: genres('Horror'),
    },
    extras: answering('dex', { progress: [progress(theBear, 22, 46, 6)] }),
  };
})();

const lena = ((): Persona => {
  const latest = episodePlay(shogun, 3, 1, 7, 'A Stick of Time');
  return {
    id: 'lena',
    label: 'List curator and commenter',
    input: {
      profile: profile('lena', {
        about: "I make lists so you don't have to. Comments are mini reviews, mostly spoiler-free. Recs welcome.",
        joinedAt: '2016-10-21T10:00:00.000Z',
        location: 'Lisbon',
        vipYears: 4,
      }),
      stats: stats({ episodes: { plays: 1_500, watched: 1_460, hours: 1_020 }, movies: { plays: 430, watched: 410 } }),
      isSelf: false,
      today: TODAY,
      latest: { episode: latest, movie: moviePlay(arrival, 8) },
      recent: {
        episodes: [
          ...episodesByDay('0 1 0 0 2 0 1 0 0 0 2 0 0 1 0 0 0 3 0 0 1 0 0 2 0 1 0 0 0 0', [shogun, theBear]),
          latest,
        ],
        movies: [moviePlay(arrival, 8), moviePlay(sicario, 15), moviePlay(dune, 22)],
      },
      watchlist: watchlist(212, [{ show: pluribus }, { show: thePitt }, { movie: sicario }]),
      genres: genres('Drama'),
    },
    extras: answering('lena', { progress: [progress(shogun, 7, 10, 3), progress(theBear, 46, 46, 50)] }),
  };
})();

const sam = ((): Persona => {
  const movies = [moviePlay(duneTwo, 2), moviePlay(dune, 3)];
  return {
    id: 'sam',
    label: 'Brand-new user',
    input: {
      profile: profile('sam', { joinedAt: '2026-10-02T10:00:00.000Z', location: 'Omicron Persei 8' }),
      stats: stats({ episodes: { plays: 0, watched: 0, hours: 0 }, movies: { plays: 2, watched: 2 } }),
      isSelf: false,
      today: TODAY,
      latest: { movie: movies[0] },
      recent: { episodes: [], movies },
      watchlist: watchlist(3, [{ movie: dune }, { movie: arrival }, { movie: sicario }]),
      genres: genres('Science Fiction'),
    },
    extras: answering('sam', { progress: [] }),
  };
})();

export const boxPersonas = { maya, dex, lena, sam };
