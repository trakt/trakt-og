import type { UserStatsResponse } from '@trakt/api';
import type { ProfileUser } from '../../ProfileUser.ts';
import type { WatchedGenreRow } from '../watchedGenresSchema.ts';
import type { WatchedItemRow } from '../watchedItemsSchema.ts';
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

const imagePath = (kind: 'shows' | 'movies', trakt: number) =>
  `media.trakt.tv/images/${kind}/${String(trakt).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1/$2/$3')}`;

type MediaArgs = [
  trakt: number,
  slug: string,
  title: string,
  year: number,
  art: string,
  genres: string,
  aired?: number,
];

const media = (kind: 'shows' | 'movies', [trakt, slug, title, year, art, genres, aired]: MediaArgs) => {
  const [fanart, poster] = art.split(' ');
  const path = imagePath(kind, trakt);
  return {
    ids: { trakt, slug },
    title,
    year,
    runtime: kind === 'shows' ? 45 : 120,
    aired_episodes: aired ?? null,
    genres: genres.split(' '),
    images: {
      fanart: [`${path}/fanarts/medium/${fanart}.jpg.webp`],
      poster: [`${path}/posters/medium/${poster}.jpg.webp`],
    },
  };
};
const show = (...args: MediaArgs) => media('shows', args);
const film = (...args: MediaArgs) => media('movies', args);

const severance = show(154997, 'severance', 'Severance', 2022, '9400ecb8e2 f60ddb06de', 'science-fiction mystery', 19);
const shogun = show(170054, 'shogun-2024', 'Shōgun', 2024, '5295f531e4 6c986db7d0', 'drama war', 10);
const slowHorses = show(155534, 'slow-horses', 'Slow Horses', 2022, '631e5c2683 6b6d40b6de', 'drama crime', 33);
const thePitt = show(232884, 'the-pitt', 'The Pitt', 2025, '83c378f8a1 f45f3b3c1f', 'drama', 30);
const theBear = show(189717, 'the-bear', 'The Bear', 2022, '59290b738d ef28e34e51', 'drama comedy', 46);
const pluribus = show(206790, 'pluribus', 'Pluribus', 2025, '27e7ef3b00 e255ecc15c', 'drama fantasy', 9);
const theOffice = show(2302, 'the-office', 'The Office', 2005, 'f8291605e7 af6d76d403', 'comedy', 186);
const theThing = film(843, 'the-thing-1982', 'The Thing', 1982, '12e0dff3af aec9f68dac', 'horror mystery');
const alien = film(295, 'alien-1979', 'Alien', 1979, '8dc868d676 42faf18edc', 'horror science-fiction');
const duneTwo = film(537449, 'dune-part-two-2024', 'Dune: Part Two', 2024, 'b7e56e851f 2acc44f507', 'science-fiction');
const dune = film(287071, 'dune-2021', 'Dune', 2021, '4257cce705 ac59f28ad6', 'science-fiction adventure');
const arrival = film(210803, 'arrival-2016', 'Arrival', 2016, '00dd6427c9 fc306afd42', 'science-fiction drama');
const sicario = film(171369, 'sicario-2015', 'Sicario', 2015, '06c19bf336 a3938a03db', 'crime thriller');
const sinners = film(997581, 'sinners-2025', 'Sinners', 2025, 'cbebc553c1 5f2fd22691', 'horror thriller');
const weapons = film(867094, 'weapons-2025', 'Weapons', 2025, '61b76e51d4 70d5a3734e', 'horror mystery');
const nosferatu = film(808857, 'nosferatu-2024', 'Nosferatu', 2024, '0c8cd6c840 b1fde04511', 'horror fantasy');

type Show = typeof severance;
type Movie = typeof theThing;

const episodePlay = (played: Show, daysAgo: number, season = 1, number = 1, title: string | null = null) => ({
  watched_at: at(daysAgo),
  show: played,
  episode: { ids: { trakt: played.ids.trakt * 1000 + season * 100 + number }, season, number, title, runtime: 45 },
});
const moviePlay = (movie: Movie, daysAgo: number) => ({ watched_at: at(daysAgo), movie });

/** Episodes per day for the last 30 days, oldest first, cycling through `shows`. */
const episodesByDay = (perDay: string, shows: readonly Show[]) =>
  perDay.split(' ').map(Number).flatMap((count, i) =>
    Array.from({ length: count }, (_, n) => episodePlay(shows[(i + n) % shows.length] ?? severance, 29 - i))
  );

/** Rows of the watched lists: plays, and when last watched. */
const watchedShow = (watched: Show, plays: number, daysAgo: number): WatchedItemRow => ({
  plays,
  last_watched_at: at(daysAgo),
  show: watched,
});
const watchedMovie = (movie: Movie, plays: number, daysAgo: number): WatchedItemRow => ({
  plays,
  last_watched_at: at(daysAgo),
  movie,
});
/** Movies to fill out a watched list. */
const filler = (count: number, plays: number, daysAgo: number) =>
  Array.from(
    { length: count },
    (_, i) =>
      watchedMovie(
        { ...theThing, ids: { trakt: 900_000 + i, slug: `filler-${i}` }, title: `Filler ${i}` },
        plays,
        daysAgo,
      ),
  );

type Distribution = readonly [number, number, number, number, number, number, number, number, number, number];

const stats = (
  { episodes, movies, ratings = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], comments = 0, progress = [0, 0], lists = 0 }: {
    episodes: { plays: number; watched: number; hours: number };
    movies: { plays: number; watched: number };
    /** How many 1s to 10s. */
    ratings?: Distribution;
    comments?: number;
    /** Shows finished and started. */
    progress?: readonly [number, number];
    lists?: number;
  },
): UserStatsResponse => ({
  movies: {
    plays: movies.plays,
    watched: movies.watched,
    minutes: movies.plays * 115,
    collected: 0,
    ratings: 0,
    comments,
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
  progress: { finished: progress[0], started: progress[1], dropped: 0 },
  lists,
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

/** All-time genre shares, most played first, as "slug:Name:percentage" with `_` for spaces. */
const genres = (rows: string): readonly WatchedGenreRow[] =>
  rows.split(' ').map((row) => {
    const [slug = '', name = '', percentage = '0'] = row.split(':');
    return {
      play_count: Number(percentage) * 10,
      genre: { slug, name: name.replace(/_/g, ' ') },
      percentage: Number(percentage),
      percentage_row: 100,
      movies: { play_count: 0, ids: [] },
      shows: { play_count: 0, ids: [] },
      episodes: { play_count: 0, ids: [] },
    };
  });

const watchlist = (count: number, rows: readonly ({ show: Show } | { movie: Movie })[]) => ({ count, rows });

/** One show's progress row, as `/users/:id/progress/watched/added/desc` returns it. */
const progress = (watched: Show, completed: number, aired: number, daysAgo: number) => ({
  show: { ids: watched.ids, title: watched.title },
  progress: { aired, completed, last_watched_at: at(daysAgo) },
});

/** One of the user's lists, as `/users/:id/lists?extended=images` returns it. */
const list = (
  name: string,
  [likes, items, comments, daysAgo]: [number, number, number, number],
  posters: readonly Movie[],
) => ({
  name,
  ids: { slug: name.toLowerCase().replace(/\W+/g, '-') },
  likes,
  item_count: items,
  comment_count: comments,
  updated_at: at(daysAgo),
  images: { posters: posters.map(({ images }) => images.poster[0]) },
});

type Answers = {
  progress?: readonly unknown[];
  lists?: readonly unknown[];
  /** The newest movie rated 10. */
  latestTen?: Movie;
};

/** The boxes' extra requests, answered from a persona's data. */
const answering = (id: string, { progress = [], lists = [], latestTen }: Answers) => () =>
  boxExtraLoader({
    fetch: (request) => {
      const { pathname } = new URL(request instanceof Request ? request.url : request.toString());
      if (pathname.includes('/progress/watched')) return Promise.resolve(Response.json(progress));
      if (pathname.endsWith('/lists')) return Promise.resolve(Response.json(lists));
      const ten = latestTen ? [{ type: 'movie', rating: 10, movie: latestTen }] : [];
      return Promise.resolve(Response.json(pathname.includes('/ratings/') ? ten : []));
    },
    token: null,
    id,
  });

type Persona = {
  readonly label: string;
  readonly input: BoxInput;
  /** The boxes' extra requests, answered from the persona's data. */
  readonly extras: () => ReturnType<typeof boxExtraLoader>;
};

const maya = ((): Persona => {
  const latest = episodePlay(severance, 0, 2, 9, 'The After Hours');
  const binge = Array.from({ length: 11 }, (_, i) => episodePlay(severance, 9, 2, i + 1));
  const recent = episodesByDay(
    '3 2 0 5 8 12 14 2 1 0 3 4 10 12 3 2 3 0 5 14 0 2 2 4 0 6 12 14 3 1',
    [severance, slowHorses, thePitt, pluribus],
  );
  return {
    label: 'Binge TV watcher',
    input: {
      profile: profile('maya', { joinedAt: '2019-06-14T10:00:00.000Z', location: 'Leeds' }),
      stats: stats({
        episodes: { plays: 3_600, watched: 3_410, hours: 2_360 },
        movies: { plays: 75, watched: 72 },
        ratings: [0, 0, 1, 1, 3, 6, 12, 14, 7, 4],
        comments: 2,
        progress: [64, 90],
      }),
      isSelf: false,
      today: TODAY,
      latest: { episode: latest, movie: moviePlay(dune, 12) },
      recent: { episodes: [...recent, ...binge, latest], movies: [moviePlay(dune, 12)] },
      watched: {
        shows: [watchedShow(severance, 38, 0), watchedShow(theOffice, 558, 20), watchedShow(slowHorses, 33, 6)],
        movies: [watchedMovie(dune, 1, 12), ...filler(3, 3, 100)],
      },
      watchlist: watchlist(34, [{ show: thePitt }, { show: slowHorses }, { show: pluribus }]),
      genres: genres(
        'drama:Drama:45 science-fiction:Science_Fiction:30 mystery:Mystery:15 crime:Crime:15 fantasy:Fantasy:14 ' +
          'adventure:Adventure:14',
      ),
    },
    extras: answering('maya', { progress: [progress(severance, 18, 19, 0), progress(slowHorses, 33, 33, 6)] }),
  };
})();

const dex = ((): Persona => {
  const horror = [theThing, alien, sinners, weapons, nosferatu];
  const movies = [1, 4, 5, 7, 9, 11, 12, 15, 17, 19, 20, 22, 24, 27, 29].map((daysAgo, i) =>
    moviePlay(horror[i % horror.length] ?? theThing, daysAgo)
  );
  return {
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
        comments: 140,
        progress: [8, 20],
        lists: 4,
      }),
      isSelf: false,
      today: TODAY,
      latest: { episode: episodePlay(theBear, 6, 3, 4), movie: moviePlay(theThing, 1) },
      recent: {
        episodes: episodesByDay('0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 0 3 0 0 0 0 0', [theBear]),
        movies,
      },
      watched: {
        shows: [watchedShow(theBear, 22, 6)],
        movies: [watchedMovie(alien, 9, 12), watchedMovie(theThing, 4, 1), ...filler(21, 3, 200)],
      },
      watchlist: watchlist(140, [{ movie: sinners }, { movie: weapons }, { movie: nosferatu }]),
      genres: genres(
        'drama:Drama:22 horror:Horror:12 thriller:Thriller:14 science-fiction:Science_Fiction:12 mystery:Mystery:12 ' +
          'comedy:Comedy:10 fantasy:Fantasy:8',
      ),
    },
    extras: answering('dex', {
      progress: [progress(theBear, 22, 46, 6)],
      lists: [
        list('Practical Effects Hall of Fame', [31, 42, 3, 40], [theThing, alien, nosferatu]),
        list('October', [4, 31, 0, 60], [sinners, weapons, theThing]),
        list('Rewatch', [2, 12, 0, 90], [alien]),
        list('Seen in theaters', [1, 80, 0, 120], [sinners]),
      ],
      latestTen: theThing,
    }),
  };
})();

const lena = ((): Persona => {
  const latest = episodePlay(shogun, 3, 1, 7, 'A Stick of Time');
  return {
    label: 'List curator and commenter',
    input: {
      profile: profile('lena', {
        about: "I make lists so you don't have to. Comments are mini reviews, mostly spoiler-free. Recs welcome.",
        joinedAt: '2016-10-21T10:00:00.000Z',
        location: 'Lisbon',
        vipYears: 4,
      }),
      stats: stats({
        episodes: { plays: 1_500, watched: 1_460, hours: 1_020 },
        movies: { plays: 430, watched: 410 },
        ratings: [2, 4, 10, 22, 48, 90, 150, 160, 88, 36],
        comments: 312,
        progress: [30, 70],
        lists: 23,
      }),
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
      watched: {
        shows: [watchedShow(shogun, 7, 3), watchedShow(theBear, 46, 50)],
        movies: [watchedMovie(arrival, 2, 8), watchedMovie(sicario, 1, 15), watchedMovie(dune, 1, 22)],
      },
      watchlist: watchlist(212, [{ show: pluribus }, { show: thePitt }, { movie: sicario }]),
      genres: genres(
        'drama:Drama:45 science-fiction:Science_Fiction:30 war:War:15 comedy:Comedy:15 crime:Crime:15 ' +
          'thriller:Thriller:15 adventure:Adventure:15',
      ),
    },
    extras: answering('lena', {
      progress: [progress(shogun, 7, 10, 3), progress(theBear, 46, 46, 50)],
      lists: [
        list('80s Horror Essentials', [1_204, 87, 64, 2], [theThing, alien, nosferatu]),
        ...Array.from(
          { length: 22 },
          (_, i) => list(`Lena's list ${i + 1}`, [i < 12 ? 53 : 0, 20, 2, 30 + i], [arrival, sicario, dune]),
        ),
      ],
      latestTen: film(842677, 'past-lives-2023', 'Past Lives', 2023, 'none none', 'drama'),
    }),
  };
})();

const sam = ((): Persona => {
  const movies = [moviePlay(duneTwo, 2), moviePlay(dune, 3)];
  return {
    label: 'Brand-new user',
    input: {
      profile: profile('sam', { joinedAt: '2026-10-02T10:00:00.000Z', location: 'Omicron Persei 8' }),
      stats: stats({
        episodes: { plays: 0, watched: 0, hours: 0 },
        movies: { plays: 2, watched: 2 },
        ratings: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      }),
      isSelf: false,
      today: TODAY,
      latest: { movie: movies[0] },
      recent: { episodes: [], movies },
      watched: { shows: [], movies: [watchedMovie(duneTwo, 1, 2), watchedMovie(dune, 1, 3)] },
      watchlist: watchlist(3, [{ movie: dune }, { movie: arrival }, { movie: sicario }]),
      genres: genres('science-fiction:Science_Fiction:100 adventure:Adventure:50'),
    },
    extras: answering('sam', {}),
  };
})();

export const boxPersonas = { maya, dex, lena, sam };
