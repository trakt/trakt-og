import type { ExternalRating, ExternalRatingLogo } from '../components/summary/ExternalRating.ts';
import { toExternalRatings } from '../components/summary/toExternalRatings.ts';
import { readableStat } from '../utils/readableStat.ts';

type Ratings = Parameters<typeof toExternalRatings>[0]['ratings'];

// Each site sort's logo, by its prefix: Rotten Tomatoes' logos also carry the item's state.
const SITES: Readonly<Record<string, string>> = {
  imdb_rating: 'imdb',
  imdb_votes: 'imdb',
  tmdb_rating: 'tmdb',
  tmdb_votes: 'tmdb',
  rt_tomatometer: 'tomatometer',
  rt_audience: 'audience',
  metascore: 'metacritic',
};

export const isExternalSort = (by: string) => Object.hasOwn(SITES, by);

/** The line under the title for a site sort: the site's logo, the score in bold, then its votes where it has any. */
export type ExternalSortLine = {
  readonly logo: ExternalRatingLogo;
  readonly title: string;
  readonly rating: string;
  readonly votes?: string;
  readonly metascore?: ExternalRating['metascore'];
};

const voteCount = (votes: number) => `${readableStat(votes)} ${votes === 1 ? 'vote' : 'votes'}`;

/** The sort's site from an item's ratings, or null when that site has no score for it. A votes sort shows the same line. */
export function toExternalSortLine(by: string, ratings: Ratings): ExternalSortLine | null {
  const site = SITES[by];
  const rating = site && toExternalRatings({ ratings }).find(({ logo }) => logo.startsWith(site));
  if (!rating) return null;
  const { logo, title, metascore, votes } = rating;
  return {
    logo,
    title,
    rating: rating.rating,
    ...(votes !== undefined && { votes: voteCount(votes) }),
    ...(metascore && { metascore }),
  };
}
