import type { mediaSpoilers } from '../../settings/mediaSpoilers.ts';
import type { toEpisodeSummary } from '../../shows/toEpisodeSummary.ts';
import { toSeoDescription } from '../toSeoDescription.ts';
import { toShareImageUrl } from '../toShareImageUrl.ts';
import { compact } from './compact.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';
import { toAggregateRating } from './toAggregateRating.ts';
import { toIsoDate } from './toIsoDate.ts';
import { toIsoDuration } from './toIsoDuration.ts';

type EpisodeJsonLdSource = Pick<
  ReturnType<typeof toEpisodeSummary>,
  | 'title'
  | 'season'
  | 'episodeNumber'
  | 'href'
  | 'seasonHref'
  | 'showHref'
  | 'showTitle'
  | 'overview'
  | 'screenshot'
  | 'fanart'
  | 'runtime'
  | 'firstAired'
  | 'rating'
>;

type Params = {
  episode: EpisodeJsonLdSource;
  /** The viewer's spoiler settings: a hidden title, overview or screenshot stays out. */
  spoilers: Pick<ReturnType<typeof mediaSpoilers>, 'title' | 'overview' | 'screenshot'>;
};

/** An episode as schema.org's `TVEpisode`, part of its `TVSeason` and `TVSeries`. */
export function toEpisodeJsonLd({ episode, spoilers }: Params): JsonLd {
  const image = (!spoilers.screenshot && episode.screenshot) || episode.fanart;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: spoilers.title ? `Episode ${episode.episodeNumber}` : episode.title,
    description: spoilers.overview ? undefined : toSeoDescription(episode.overview),
    url: toAbsoluteUrl(episode.href),
    image: image && toShareImageUrl(image),
    episodeNumber: episode.episodeNumber,
    datePublished: toIsoDate(episode.firstAired),
    duration: toIsoDuration(episode.runtime),
    partOfSeason: { '@type': 'TVSeason', seasonNumber: episode.season, url: toAbsoluteUrl(episode.seasonHref) },
    partOfSeries: { '@type': 'TVSeries', name: episode.showTitle, url: toAbsoluteUrl(episode.showHref) },
    aggregateRating: toAggregateRating(episode.rating),
  });
}
