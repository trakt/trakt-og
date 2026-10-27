import type { toSeasonSummary } from '../../shows/toSeasonSummary.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Season = Pick<ReturnType<typeof toSeasonSummary>, 'fullTitle' | 'overview' | 'seasonPoster' | 'fanart'>;

/**
 * `/shows/:id/seasons/:season`: "Severance: Season 2", its overview (the summary already falls back to the show's) and
 * its own poster, else the show's fanart.
 */
export function toSeasonSeo(season: Season): SeoMeta {
  return {
    title: season.fullTitle,
    description: season.overview || `Every episode of ${season.fullTitle}, with ratings, comments and lists on Trakt.`,
    image: season.seasonPoster ?? season.fanart,
    imageAlt: season.fullTitle,
    type: 'video.tv_show',
  };
}
