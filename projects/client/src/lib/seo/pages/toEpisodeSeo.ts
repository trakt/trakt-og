import type { toEpisodeSummary } from '../../shows/toEpisodeSummary.ts';
import { toBreadcrumbJsonLd } from '../jsonLd/toBreadcrumbJsonLd.ts';
import { toEpisodeJsonLd } from '../jsonLd/toEpisodeJsonLd.ts';
import { toTitleCrumbs } from '../jsonLd/toTitleCrumbs.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Params = Parameters<typeof toEpisodeJsonLd>[0] & {
  episode: Pick<ReturnType<typeof toEpisodeSummary>, 'parents'>;
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * An episode page: "Severance S01E02: Half Loop", its overview and its screenshot, else the show's fanart, with its
 * structured data. The viewer's spoiler settings keep a hidden title, overview or screenshot out of the head too.
 */
export function toEpisodeSeo({ episode, spoilers }: Params): SeoMeta {
  const code = `${episode.showTitle} S${pad(episode.season)}E${pad(episode.episodeNumber)}`;
  const title = spoilers.title ? code : `${code}: ${episode.title}`;
  return {
    title,
    description:
      (!spoilers.overview && episode.overview) ||
      `Season ${episode.season}, episode ${episode.episodeNumber} of ${episode.showTitle}.`,
    image: (!spoilers.screenshot && episode.screenshot) || episode.fanart,
    imageAlt: title,
    type: 'video.episode',
    jsonLd: [
      toEpisodeJsonLd({ episode, spoilers }),
      toBreadcrumbJsonLd(toTitleCrumbs({ title, href: episode.href, parents: episode.parents })),
    ],
  };
}
