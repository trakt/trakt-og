import type { EpisodeResponse } from '@trakt/api';
import type { ComponentProps } from 'svelte';
import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import type FanartCard from '../components/media/FanartCard.svelte';
import { mediaImage } from '../images/mediaImage.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { formatDate } from '../utils/formatDate.ts';
import { airDateParts } from './airDateParts.ts';
import { airsTip } from './airsTip.ts';
import { earlyStreamDate } from './earlyStreamDate.ts';
import { episodeReleasedAt } from './episodeReleasedAt.ts';
import { isEpisodeWatchable } from './isEpisodeWatchable.ts';
import type { EpisodeCard } from './toShowSummary.ts';

type Tag = NonNullable<ComponentProps<typeof FanartCard>['tags']>[number];

/** What an episode card takes from its show, small enough for the page to hand the browser. */
export type EpisodeCardContext = {
  showId: number;
  /** The show's page, which the episode links hang from. */
  href: string;
  network?: string;
  genres?: readonly string[] | null;
  /** Minutes, for an episode that has none of its own. */
  runtime?: number;
  /** Off when the viewer hides episode type tags ("Season Premiere"). */
  episodeTypeTags: boolean;
  /** The zone the card's air time is told in. */
  timeZone: string;
};

type Params = {
  episode: EpisodeResponse;
  context: EpisodeCardContext;
  datePreferences: DatePreferences;
  now: Date;
};

/** A card in Up Next / Recently Aired. */
export function toEpisodeCard({ episode, context, datePreferences, now }: Params): EpisodeCard {
  const { showId, href, network, genres, runtime, timeZone } = context;
  const format = (date: string, options: Parameters<typeof formatDate>[1]) =>
    formatDate(date, { ...datePreferences, timeZone, ...options });
  const split = (at: string) => {
    const { date, time } = airDateParts(at, { ...datePreferences, timeZone, format: 'll' });
    return { text: date, segments: [time] };
  };
  const label = context.episodeTypeTags ? episodeType(episode) : undefined;
  const streams = earlyStreamDate(episode);
  const tags: Tag[] = [
    ...(label ? [label] : []),
    ...(streams
      ? [
          {
            text: format(streams, { format: 'll', timeZone: 'UTC' }),
            segments: ['Streaming'],
            airs: airsTip(episode.first_aired, {
              network,
              now,
              parts: (at) => airDateParts(at, { ...datePreferences, timeZone, format: 'LL' }),
            }),
          },
        ]
      : episode.first_aired
        ? [split(episode.first_aired)]
        : []),
  ];
  return {
    id: episode.ids.trakt,
    collectionContext: { show: showId, number: episode.season, episode: episode.number },
    href: `${href}/seasons/${episode.season}/episodes/${episode.number}`,
    number: episodeNumber(episode, genres),
    title: episode.title ?? `Episode ${episode.number}`,
    image: mediaImage({ type: 'episode', id: episode.ids.trakt, slot: 'screenshot', size: 'thumb' }),
    spoilerImage: mediaImage({ type: 'show', id: showId, slot: 'fanart', size: 'thumb' }),
    tags,
    rating: episode.rating ?? 0,
    released: isEpisodeWatchable(episodeReleasedAt(episode), now.getTime()),
    runtime: episode.runtime ?? runtime,
  };
}
