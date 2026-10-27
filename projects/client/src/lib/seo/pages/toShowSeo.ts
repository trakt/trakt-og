import type { toShowSummary } from '../../shows/toShowSummary.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Show = Pick<ReturnType<typeof toShowSummary>, 'fullTitle' | 'overview' | 'fanart' | 'poster'>;

/** `/shows/:id`: "Severance (2022)", its overview and its fanart, else its poster. */
export function toShowSeo(show: Show): SeoMeta {
  return {
    title: show.fullTitle,
    description:
      show.overview || `Where to watch ${show.fullTitle}, its seasons, ratings, comments and lists on Trakt.`,
    image: show.fanart ?? show.poster,
    imageAlt: show.fullTitle,
    type: 'video.tv_show',
  };
}
