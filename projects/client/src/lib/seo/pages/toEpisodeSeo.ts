import type { mediaSpoilers } from '../../settings/mediaSpoilers.ts';
import type { toEpisodeSummary } from '../../shows/toEpisodeSummary.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Episode = Pick<
  ReturnType<typeof toEpisodeSummary>,
  'showTitle' | 'season' | 'episodeNumber' | 'title' | 'overview' | 'screenshot' | 'fanart'
>;

type Params = {
  episode: Episode;
  /** The viewer's spoiler settings: a hidden title, overview or screenshot stays out of the head too. */
  spoilers: Pick<ReturnType<typeof mediaSpoilers>, 'title' | 'overview' | 'screenshot'>;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** An episode page: "Severance S01E02: Half Loop", its overview and its screenshot, else the show's fanart. */
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
  };
}
