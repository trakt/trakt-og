import type { ComponentProps } from 'svelte';
import type PosterCard from '../components/media/PosterCard.svelte';
import type FanartCard from '../components/media/FanartCard.svelte';
import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import { mediaTags } from '../components/labels/mediaTags.ts';
import type { TagPill } from '../components/labels/TagPill.ts';
import { airTime } from './airTime.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { toCalendarImage } from './toCalendarImage.ts';
import type { toCalendarPreferences } from './toCalendarPreferences.ts';
import type { CalendarItem } from './calendarDays.ts';

type Tag = NonNullable<ComponentProps<typeof FanartCard>['tags']>[number];

/** A calendar entry as a fanart card, plus what its quick icons need. */
export type CalendarCard = Omit<ComponentProps<typeof FanartCard>, 'icons'> & {
  key: string;
  episodeBadge?: ComponentProps<typeof PosterCard>['episodeBadge'];
  tagline?: string;
  rating?: number;
  /** Aired or released by now. Before that the card shows no rating. */
  released: boolean;
  schedule?: string;
  /** The show or movie's fanart, whatever the artwork: the Watch Now modal's backdrop. */
  fanart?: string;
  /** An episode's air time in the viewer's clock. Movies have none: a release date has no time. */
  time?: string;
  /** The tag pills under a card's titles, like search's: the certificate, runtime and network. */
  pills: TagPill[];
  /** Minutes, so the watched tooltip can total the plays. */
  runtime?: number;
  hideTarget?: { type: 'show'; id: number; title: string };
  overlay: { type: 'episode' | 'movie'; id: number };
  collectionContext?: { show: number; number: number; episode: number };
  /** Episodes get the watch-now icon and a ••• with Drop show. */
  episode: boolean;
  /** An episode's show, whose watchlisting the fade and hide menu counts too. */
  show?: number;
};

type ClockPreferences = Pick<DatePreferences, 'timeZone' | 'hour24'>;

/** Maps a calendar entry onto OG's calendar fanart card, logo image type. */
export function toCalendarCard(
  item: CalendarItem,
  clock: ClockPreferences & { imageType?: ReturnType<typeof toCalendarPreferences>['imageType'] },
  now = new Date(),
): CalendarCard {
  const released = new Date(item.at) <= now;
  if (item.type === 'movie') {
    const { movie } = item;
    const runtime = movie.runtime ?? undefined;
    return {
      key: `movie-${movie.ids.trakt}`,
      overlay: { type: 'movie', id: movie.ids.trakt },
      episode: false,
      href: `/movies/${movie.ids.slug}`,
      title: movie.title,
      year: movie.year ?? undefined,
      rating: movie.rating ?? undefined,
      released,
      tagline: movie.tagline ?? undefined,
      pills: mediaTags({
        type: 'movie',
        certification: movie.certification ?? undefined,
        runtime,
      }),
      runtime,
      ...toCalendarImage(item, clock.imageType ?? 'logo'),
    };
  }

  const { show, episode } = item;
  const label = episodeType(episode);
  const time = airTime(item.at, clock);
  const runtime = episode.runtime ?? show.runtime ?? undefined;
  const tags: Tag[] = [
    ...(label ? [label] : []),
    { text: time },
    ...(show.network ? [{ text: show.network, kind: 'generic' as const }] : []),
  ];

  return {
    key: `episode-${episode.ids.trakt}`,
    overlay: { type: 'episode', id: episode.ids.trakt },
    collectionContext: { show: show.ids.trakt, number: episode.season, episode: episode.number },
    hideTarget: { type: 'show', id: show.ids.trakt, title: show.title },
    episode: true,
    show: show.ids.trakt,
    href: `/shows/${show.ids.slug}/seasons/${episode.season}/episodes/${episode.number}`,
    number: episodeNumber(episode, show.genres),
    title: episode.title ?? '',
    smallTitle: { text: show.title, href: `/shows/${show.ids.slug}` },
    rating: episode.rating ?? undefined,
    released,
    schedule: `${time}${show.network ? ` on ${show.network}` : ''}`,
    time,
    pills: mediaTags({
      type: 'show',
      certification: show.certification ?? undefined,
      runtime,
      network: show.network ?? undefined,
    }),
    runtime,
    ...toCalendarImage(item, clock.imageType ?? 'logo'),
    tags,
    episodeBadge: label ? { label: label.text, kind: label.kind } : undefined,
  };
}
