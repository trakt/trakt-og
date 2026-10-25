import { toExternalRatings } from '../../../lib/components/summary/toExternalRatings.ts';
import { episodeType } from '../../../lib/components/media/episodeTags.ts';
import { type ImageSize, imageUrl } from '../../../lib/utils/imageUrl.ts';

/** Real items with their real art and counts, so the summary, episode and action demos look like their pages. */
const art = (path: string, size: ImageSize) => imageUrl(`media.trakt.tv/images/${path}`, size);

export const noWayHome = {
  type: 'movie',
  id: 474180,
  title: 'Spider-Man: No Way Home',
  fullTitle: 'Spider-Man: No Way Home (2021)',
  year: 2021,
  href: '/movies/spider-man-no-way-home-2021',
  certification: 'PG-13',
  runtime: 148,
  rating: 8.49,
  votes: 61_140,
  favorited: 4_444,
  tagline: 'Enter the Multiverse.',
  overview:
    'Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man.',
  collection: { title: 'Spider-Man (MCU) Collection', href: '/lists/official/spider-man-mcu-collection' },
  credits: { duringCredits: true, afterCredits: true },
  poster: art('movies/000/474/180/posters/medium/9ce30fb23f.jpg.webp', 'medium'),
  posterThumb: art('movies/000/474/180/posters/medium/9ce30fb23f.jpg.webp', 'thumb'),
  fanart: art('movies/000/474/180/fanarts/medium/9af09a031b.jpg.webp', 'full'),
  fanartThumb: art('movies/000/474/180/fanarts/medium/9af09a031b.jpg.webp', 'thumb'),
  tmdb: 'https://www.themoviedb.org/movie/634649',
  external: toExternalRatings({
    ratings: {
      imdb: { rating: 8.2, votes: 998_068, link: 'https://www.imdb.com/title/tt10872600' },
      tmdb: { rating: 7.9, votes: 23_393, link: 'https://www.themoviedb.org/movie/634649' },
      rotten_tomatoes: {
        rating: 93,
        state: 'fresh',
        user_rating: 97,
        user_state: 'upright',
        link: 'https://www.rottentomatoes.com/m/spider_man_no_way_home',
      },
      metascore: { rating: 71, link: 'https://www.imdb.com/title/tt10872600/criticreviews' },
      letterboxd: { rating: 3.83, votes: 3_058_598, link: 'https://letterboxd.com/film/spider-man-no-way-home' },
    },
  }),
} as const;

export const breakingBad = {
  type: 'show',
  id: 1388,
  title: 'Breaking Bad',
  year: 2008,
  href: '/shows/breaking-bad',
  certification: 'TV-MA',
  runtime: 50,
  airedEpisodes: 62,
  rating: 9.32,
  poster: art('shows/000/001/388/posters/medium/fa39b59954.jpg.webp', 'medium'),
  posterThumb: art('shows/000/001/388/posters/medium/fa39b59954.jpg.webp', 'thumb'),
  fanart: art('shows/000/001/388/fanarts/medium/fdbc0cb02d.jpg.webp', 'full'),
  fanartThumb: art('shows/000/001/388/fanarts/medium/fdbc0cb02d.jpg.webp', 'thumb'),
} as const;

export const seasonOne = {
  type: 'season',
  id: 3950,
  title: 'Season 1',
  fullTitle: 'Breaking Bad Season 1',
  href: '/shows/breaking-bad/seasons/1',
  airedEpisodes: 7,
  rating: 8.5,
  season: { show: breakingBad.id, number: 1 },
  poster: art('seasons/000/003/950/posters/medium/eded236292.jpg.webp', 'thumb'),
} as const;

export const pilot = {
  type: 'episode',
  id: 73482,
  title: 'Pilot',
  number: '1x01',
  fullTitle: 'Breaking Bad 1x01',
  year: 2008,
  href: '/shows/breaking-bad/seasons/1/episodes/1',
  runtime: 59,
  rating: 8.37,
  votes: 5_008,
  season: { show: breakingBad.id, number: 1, episode: 1 },
  screenshot: art('episodes/000/073/482/screenshots/medium/ef3352bcb8.jpg.webp', 'full'),
  screenshotThumb: art('episodes/000/073/482/screenshots/medium/ef3352bcb8.jpg.webp', 'thumb'),
  episodeType: episodeType({ season: 1, number: 1 }),
  parents: [
    { title: breakingBad.title, href: breakingBad.href },
    { title: seasonOne.title, href: seasonOne.href },
  ],
  stats: { watchers: 394_680, plays: 469_257, collectors: 623_907, lists: 868 },
  comments: 30,
  external: toExternalRatings({
    ratings: {
      imdb: { rating: 9, votes: 79_585, link: 'https://www.imdb.com/title/tt0959621' },
      tmdb: { rating: 8.5, votes: 569, link: 'https://www.themoviedb.org/tv/1396/season/1/episode/1' },
    },
  }),
} as const;

/** Breaking Bad's first four episodes, for screenshot cards. */
export const seasonOneEpisodes = [
  { episode: 1, id: 73482, title: 'Pilot', rating: 8.37, screenshot: '073/482/screenshots/medium/ef3352bcb8.jpg.webp' },
  {
    episode: 2,
    id: 73483,
    title: "Cat's in the Bag...",
    rating: 8.12,
    screenshot: '073/483/screenshots/medium/f6bf31513b.jpg.webp',
  },
  {
    episode: 3,
    id: 73484,
    title: "...And the Bag's in the River",
    rating: 8.06,
    screenshot: '073/484/screenshots/medium/9483b907fd.jpg.webp',
  },
  {
    episode: 4,
    id: 73485,
    title: 'Cancer Man',
    rating: 7.93,
    screenshot: '073/485/screenshots/medium/ca9f75795e.jpg.webp',
  },
].map(({ episode, screenshot, ...item }) => ({
  ...item,
  type: 'episode' as const,
  number: `1x0${episode}`,
  href: `${breakingBad.href}/seasons/1/episodes/${episode}`,
  season: { show: breakingBad.id, number: 1, episode },
  screenshot: art(`episodes/000/${screenshot}`, 'thumb'),
}));
