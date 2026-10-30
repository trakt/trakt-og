import type { RatingsResponse } from '@trakt/api';
import type { ExternalRating } from './ExternalRating.ts';
import type { ExtraRating } from '../../stats/extraRatingsSchema.ts';
import { capitalize } from '../../utils/capitalize.ts';

/** The JustWatch 30-day rank from `/watchnow/:country?extended=streaming_ranks`. */
export interface StreamingRank {
  readonly rank?: number | null;
  readonly delta?: number | null;
  readonly link?: string | null;
}

interface ExternalRatingsParams {
  /** With Letterboxd's rating, 0 to 5, on movies, and MyAnimeList's, 0 to 10, on anime. */
  ratings: (RatingsResponse & { letterboxd?: ExtraRating | null; mal?: ExtraRating | null }) | null;
  rank?: StreamingRank | null;
}

type RottenTomatoes = NonNullable<RatingsResponse['rotten_tomatoes']>;

function tomatometerLogo({ rating, state }: RottenTomatoes) {
  if (state === 'certified') return 'certified';
  if ((rating ?? 0) >= 60 || state === 'fresh') return 'fresh';
  if (state === 'rotten') return 'rotten';
  return 'fresh';
}

function audienceLogo({ user_state }: RottenTomatoes) {
  if (user_state === 'certified' || user_state === 'spilled') return user_state;
  return 'upright';
}

function metascoreBand(score: number) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function rankChange(delta?: number | null): ExternalRating['change'] {
  if (typeof delta !== 'number') return undefined;
  if (delta === 0) return { text: '0', trend: 'flat' };
  return { text: `${delta < 0 ? '' : '+'}${delta.toLocaleString('en-US')}`, trend: delta < 0 ? 'down' : 'up' };
}

const votes = (count?: number | null) => `${(count ?? 0).toLocaleString('en-US')} ${count === 1 ? 'vote' : 'votes'}`;

/**
 * OG's `_ratings_stats` "other sites" group, in OG's order, with Letterboxd and MyAnimeList after IMDb. Each shows only with a score above zero and a link.
 * The strip shows only the number; the tooltip names the site and gives the exact vote count, or says what the number
 * is where the API has no count (Rotten Tomatoes, Metacritic, JustWatch).
 */
export function toExternalRatings({ ratings, rank }: ExternalRatingsParams): ExternalRating[] {
  const { imdb, tmdb, rotten_tomatoes: rt, metascore, letterboxd, mal } = ratings ?? {};
  const stars = Number((letterboxd?.rating ?? 0).toFixed(1));
  const malRating = Number((mal?.rating ?? 0).toFixed(1));
  const tomatometer = rt ? tomatometerLogo(rt) : 'fresh';

  const entries: (ExternalRating | false)[] = [
    (imdb?.rating ?? 0) > 0 &&
      !!imdb?.link && {
        logo: 'imdb',
        title: 'IMDb',
        detail: votes(imdb.votes),
        votes: imdb.votes ?? 0,
        href: `${imdb.link}/ratings`,
        rating: (imdb.rating ?? 0).toFixed(1),
        score: Math.round(Number((imdb.rating ?? 0).toFixed(1)) * 10),
      },
    stars > 0 &&
      !!letterboxd?.link && {
        logo: 'letterboxd',
        title: 'Letterboxd',
        detail: votes(letterboxd.votes),
        votes: letterboxd.votes ?? 0,
        href: letterboxd.link,
        rating: stars.toFixed(1),
        score: Math.round(stars * 20),
      },
    malRating > 0 &&
      !!mal?.link && {
        logo: 'mal',
        title: 'MyAnimeList',
        detail: votes(mal.votes),
        votes: mal.votes ?? 0,
        href: mal.link,
        rating: malRating.toFixed(1),
        score: Math.round(malRating * 10),
      },
    (tmdb?.rating ?? 0) > 0 &&
      !!tmdb?.link && {
        logo: 'tmdb',
        title: 'TMDB',
        detail: votes(tmdb.votes),
        votes: tmdb.votes ?? 0,
        href: tmdb.link,
        rating: `${Math.trunc(((tmdb.rating ?? 0) / 10) * 100)}%`,
        score: Math.trunc(((tmdb.rating ?? 0) / 10) * 100),
      },
    (rt?.rating ?? 0) > 0 &&
      !!rt?.link && {
        logo: `tomatometer-${tomatometer}`,
        title: 'Rotten Tomatoes',
        detail: `Tomatometer, ${capitalize(tomatometer)}`,
        href: rt.link,
        rating: `${rt.rating}%`,
        score: rt.rating ?? 0,
      },
    (rt?.user_rating ?? 0) > 0 &&
      !!rt?.link && {
        logo: `audience-${audienceLogo(rt)}`,
        title: 'Rotten Tomatoes',
        detail: 'Popcornmeter',
        href: rt.link,
        rating: `${rt.user_rating}%`,
        score: rt.user_rating ?? 0,
      },
    (metascore?.rating ?? 0) > 0 &&
      !!metascore?.link && {
        logo: 'metacritic',
        title: 'Metacritic',
        detail: 'Metascore',
        href: metascore.link,
        rating: String(metascore.rating),
        score: metascore.rating ?? 0,
        metascore: metascoreBand(metascore.rating ?? 0),
      },
    !!rank?.rank &&
      !!rank.link && {
        logo: 'justwatch',
        title: 'JustWatch',
        detail: '30 Day Streaming Rank',
        href: rank.link,
        rating: String(rank.rank),
        change: rankChange(rank.delta),
      },
  ];

  return entries.filter((entry) => entry !== false);
}
