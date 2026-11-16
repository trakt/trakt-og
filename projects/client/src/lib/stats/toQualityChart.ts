import { episodeNumber } from '../components/media/episodeTags.ts';
import { ratingPercent } from '../utils/ratingPercent.ts';
import type { QualityData } from './QualityData.ts';
import type { QualityPoint } from './QualityPoint.ts';
import type { QualityRead } from './QualityRead.ts';

type Params = {
  read: QualityRead;
  /** The title's own page: the show's or season's, as `loadSubpageMedia` canonicalizes it. */
  href: string;
  /** The season's own rating, for its dashed line; left out when it has none. */
  reference?: { readonly percent: number };
  now: Date;
};

/** A rating under this many votes is noise: it leaves a gap in the line. */
const MIN_VOTES = 10;

/** A line needs two points to say anything. */
const MIN_POINTS = 2;

const percentOf = (rating: number | null | undefined, votes: number | null | undefined) =>
  (votes ?? 0) >= MIN_VOTES && rating ? ratingPercent(rating) : null;

function seasonPoints(read: Extract<QualityRead, { type: 'show' }>, href: string): QualityPoint[] {
  return read.seasons
    .filter(({ number, aired_episodes, episode_count }) => number > 0 && (aired_episodes ?? episode_count) !== 0)
    .map(({ number, ids, rating, votes }) => ({
      label: `Season ${number}`,
      axis: `S${number}`,
      name: `Season ${number}`,
      href: `${href}/seasons/${number}/stats`,
      traktId: ids.trakt,
      number,
      percent: percentOf(rating, votes),
      votes: votes ?? 0,
    }));
}

function episodePoints(read: Extract<QualityRead, { type: 'season' }>, href: string, now: Date): QualityPoint[] {
  return read.episodes
    .filter(({ first_aired: aired }) => !aired || new Date(aired) <= now)
    .map(({ season, number, title, ids, rating, votes }) => {
      const code = episodeNumber({ season: season ?? read.season, number }, null);
      return {
        label: `E${number}`,
        axis: `E${number}`,
        name: code,
        ...(title ? { title } : {}),
        href: `${href}/episodes/${number}/stats`,
        traktId: ids.trakt,
        number,
        percent: percentOf(rating, votes),
        votes: votes ?? 0,
      };
    });
}

/**
 * The Quality chart's view model: one point per aired season (specials left out) on a show's page, or per aired
 * episode on a season's, each rated by its Trakt votes. Null when there is nothing to draw: under two points, or no
 * point with enough votes.
 */
export function toQualityChart({ read, href, reference, now }: Params): QualityData | null {
  const points = read.type === 'show' ? seasonPoints(read, href) : episodePoints(read, href, now);
  if (points.length < MIN_POINTS || points.every(({ percent }) => percent === null)) return null;
  return {
    unit: read.type === 'show' ? 'season' : 'episode',
    points,
    reference: reference?.percent ? { percent: reference.percent, label: 'Season' } : undefined,
  };
}
