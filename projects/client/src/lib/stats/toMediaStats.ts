import type { EpisodeStatsResponse, RatingsResponse } from '@trakt/api';
import type { z } from 'zod/v4';
import type { StreamingRank } from '../components/summary/toExternalRatings.ts';
import { toSubpageStrip } from '../subpage/toSubpageStrip.ts';
import type { SubpageMedia } from '../subpage/toSubpageMedia.ts';
import { RATING_LABELS } from '../components/rating/ratingPrompt.ts';
import { type ProfileRatings, toProfileRatings } from '../users/profile/toProfileRatings.ts';
import { countLabel } from '../utils/countLabel.ts';
import { toCommunityStats } from './toCommunityStats.ts';
import type { letterboxdSchema } from './letterboxdSchema.ts';
import { toSiteScores } from './toSiteScores.ts';
import { ratingPercent } from '../utils/ratingPercent.ts';

type Params = {
  media: SubpageMedia;
  ratings: RatingsResponse;
  /** Movies only. */
  letterboxd?: Letterboxd | null;
  stats: EpisodeStatsResponse & { favorited?: number };
  rank: StreamingRank | null;
  otherSiteRatings: boolean;
  now: Date;
};

type Letterboxd = NonNullable<z.infer<typeof letterboxdSchema>['letterboxd']>;

/** "Good" and up: where the Liked it key starts counting. */
const LIKED_FROM = 7;

type KeysParams = {
  chart: ProfileRatings['chart'];
  votes: number;
  watchers: number;
  percent: number;
  level: number;
};

/** "20%", "0.4%": whole numbers from 10% up, one place under that. */
function shareOf(part: number, whole: number) {
  const share = (part / whole) * 100;
  return share >= 10 ? `${Math.round(share)}%` : `${Math.round(share * 10) / 10}%`;
}

/**
 * The keys under the votes chart: the Trakt rating ruled in its rating's color, the API's vote total with the share of
 * watchers who voted, the most given rating with its name, and the share who liked it, a 7 or higher.
 */
function ratingKeys({ chart, votes, watchers, percent, level }: KeysParams) {
  const top = chart?.bars.find((bar) => bar.top);
  if (!chart || !top) return [];
  const total = chart.bars.reduce((sum, bar) => sum + bar.count, 0);
  const liked = chart.bars.filter((bar) => bar.rating >= LIKED_FROM).reduce((sum, bar) => sum + bar.count, 0);
  return [
    { name: 'Rating', rating: level || undefined, share: `${percent}%`, counts: [RATING_LABELS[level] ?? ''] },
    {
      name: 'Votes',
      share: votes.toLocaleString('en-US'),
      counts: watchers > 0 ? [`${shareOf(votes, watchers)} of watchers`] : [],
    },
    {
      name: 'Most given',
      rating: top.rating,
      share: `${top.rating} · ${top.name}`,
      counts: [`${top.share} of ${countLabel(votes, 'vote')}`],
    },
    {
      name: 'Liked it',
      rating: LIKED_FROM,
      share: shareOf(liked, total),
      counts: [`gave it ${LIKED_FROM} or higher`],
    },
  ];
}

/**
 * The four stats pages: the ratings strip with only the ratings and favorites, then the Trakt votes chart, the
 * community counts the strip used to carry and the other sites' scores beside Trakt's.
 */
export function toMediaStats({ media, ratings, letterboxd, stats, rank, otherSiteRatings, now }: Params) {
  // Before release the page shows no ratings and only the list count, whatever the early-ratings setting.
  const released = !!media.released && new Date(media.released) <= now;
  const trakt = released ? (ratings.trakt ?? ratings) : {};
  const value = trakt.rating ?? 0;
  const votes = trakt.votes ?? 0;
  const percent = ratingPercent(value);
  const type = media.item.type;
  if (type === 'list') throw new Error('Lists have no ratings');
  const favorites = type === 'movie' || type === 'show';
  const level = Math.min(10, Math.max(0, Math.trunc(value)));
  const chart = toProfileRatings({ distribution: trakt.distribution ?? undefined, unit: 'vote' }).chart;
  const strip = toSubpageStrip({
    media,
    reads: { ratings, stats, letterboxd: letterboxd ?? null },
    rank,
    otherSiteRatings,
    now,
  });
  if (!strip) throw new Error('Lists have no ratings');
  return {
    value,
    votes,
    percent,
    level,
    ratings: { chart, keys: ratingKeys({ chart, votes, watchers: stats.watchers, percent, level }) },
    community: toCommunityStats({ stats, href: media.href, favorites, released }),
    sites: toSiteScores({ external: strip.external, trakt: percent }),
    strip,
  };
}
