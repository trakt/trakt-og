import { type StreamingRank, toExternalRatings } from '../components/summary/toExternalRatings.ts';
import type { readSubpageRatings } from './readSubpageRatings.ts';
import type { SubpageMedia } from './toSubpageMedia.ts';

type Params = {
  media: SubpageMedia;
  reads: NonNullable<Awaited<ReturnType<typeof readSubpageRatings>>>;
  rank: StreamingRank | null;
  otherSiteRatings: boolean;
  now: Date;
};

/**
 * The ratings strip on an item's stats page, as on its summary: the Trakt rating, the Rate button, favorites on
 * movies and shows, and the other sites' ratings (none on seasons). Before release it shows no rating, other
 * sites or favorites, whatever the early-ratings setting. Lists have no strip.
 */
export function toSubpageStrip({ media, reads, rank, otherSiteRatings, now }: Params) {
  const type = media.item.type;
  if (type === 'list') return undefined;
  const { ratings, stats, letterboxd } = reads;
  const released = !!media.released && new Date(media.released) <= now;
  const trakt = ratings.trakt ?? ratings;
  const favorites = type === 'movie' || type === 'show';
  return {
    rating: released ? { value: trakt.rating ?? 0, votes: trakt.votes ?? 0, href: `${media.href}/stats` } : undefined,
    rateLabel: type,
    ratingTarget: { type, id: media.item.id, title: media.item.title, season: media.spoilerTarget?.season },
    external:
      otherSiteRatings && released && type !== 'season'
        ? toExternalRatings({ ratings: { ...ratings, letterboxd }, rank })
        : [],
    counts: favorites && released ? [{ count: stats.favorited ?? 0, label: 'favorited' }] : [],
  };
}
