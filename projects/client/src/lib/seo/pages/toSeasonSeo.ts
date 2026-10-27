import type { toSeasonSummary } from '../../shows/toSeasonSummary.ts';
import { toBreadcrumbJsonLd } from '../jsonLd/toBreadcrumbJsonLd.ts';
import { toSeasonJsonLd } from '../jsonLd/toSeasonJsonLd.ts';
import { toTitleCrumbs } from '../jsonLd/toTitleCrumbs.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Season = Parameters<typeof toSeasonJsonLd>[0] &
  Pick<ReturnType<typeof toSeasonSummary>, 'fullTitle' | 'seasonPoster' | 'fanart' | 'parents'>;

/**
 * `/shows/:id/seasons/:season`: "Severance: Season 2", its overview (the summary already falls back to the show's) and
 * its own poster, else the show's fanart, with its structured data.
 */
export function toSeasonSeo(season: Season): SeoMeta {
  return {
    title: season.fullTitle,
    description: season.overview || `Every episode of ${season.fullTitle}, with ratings, comments and lists on Trakt.`,
    image: season.seasonPoster ?? season.fanart,
    imageAlt: season.fullTitle,
    type: 'video.tv_show',
    jsonLd: [
      toSeasonJsonLd(season),
      toBreadcrumbJsonLd(toTitleCrumbs({ title: season.title, href: season.href, parents: season.parents })),
    ],
  };
}
