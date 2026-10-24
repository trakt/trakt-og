import type { ReportTarget } from '../../../lib/components/summary/ReportTarget.ts';
import type { WatchNowButton } from '../../../lib/components/watchnow/watchNow.ts';

/** Fight Club as a movie page passes it; the page adds its fanart from the API. */
export const fightClub = { title: 'Fight Club', year: 1999, href: '/movies/fight-club-1999' } as const;

export const reportTarget: ReportTarget = {
  type: 'movie',
  id: 1,
  title: fightClub.title,
  year: fightClub.year,
  href: fightClub.href,
  tmdb: 'https://www.themoviedb.org/movie/550',
};

const logo = (slug: string) => `https://media.trakt.tv/watchnow/sources/${slug}.webp`;

/** The sidebar block's two tiles; the dialog loads Fight Club's real offers when it opens. */
export const watchNow: WatchNowButton = {
  path: fightClub.href,
  tiles: [
    { slug: 'apple_tv', name: 'Apple TV', color: '#000000', logo: logo('apple_tv'), href: '#apple' },
    {
      slug: 'google_play_movies',
      name: 'Google Play',
      color: '#607d8b',
      logo: logo('google_play_movies'),
      href: '#gp',
    },
  ],
  count: 5,
  favorites: 1,
  cinemaOnly: false,
  hidden: false,
  country: 'us',
  favoriteKeys: ['us-youtube'],
};
