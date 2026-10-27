import { toBreadcrumbJsonLd } from '../jsonLd/toBreadcrumbJsonLd.ts';
import { toShowJsonLd } from '../jsonLd/toShowJsonLd.ts';
import { toTitleCrumbs } from '../jsonLd/toTitleCrumbs.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Show = Parameters<typeof toShowJsonLd>[0] & { readonly fullTitle: string };

/** `/shows/:id`: "Severance (2022)", its overview and its fanart, else its poster, with its structured data. */
export function toShowSeo(show: Show): SeoMeta {
  return {
    title: show.fullTitle,
    description:
      show.overview || `Where to watch ${show.fullTitle}, its seasons, ratings, comments and lists on Trakt.`,
    image: show.fanart ?? show.poster,
    imageAlt: show.fullTitle,
    type: 'video.tv_show',
    jsonLd: [toShowJsonLd(show), toBreadcrumbJsonLd(toTitleCrumbs({ title: show.fullTitle, href: show.href }))],
  };
}
