import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { airTime } from './airTime.ts';
import type { CalendarItem } from './calendarDays.ts';
import type { CalendarGroup } from './groupCalendarItems.ts';
import { type CalendarCard, toCalendarCard } from './toCalendarCard.ts';
import type { toCalendarPreferences } from './toCalendarPreferences.ts';

type Episode = Extract<CalendarItem, { type: 'episode' }>;

/** One episode in a grouped card's tray. */
export type CalendarGroupEpisode = {
  readonly id: number;
  readonly season: number;
  readonly number: number;
  readonly label: string;
  readonly title: string;
  readonly href: string;
  readonly rating?: number;
};

/** A card for every episode of one show on one day, with what its tray and its group actions need. */
export type CalendarGroupCard = CalendarCard & {
  readonly group: {
    readonly show: { readonly id: number; readonly title: string; readonly slug: string };
    readonly season: number;
    readonly label: string;
    readonly episodes: readonly CalendarGroupEpisode[];
  };
};

type Clock = Pick<DatePreferences, 'timeZone' | 'hour24'> & {
  imageType?: ReturnType<typeof toCalendarPreferences>['imageType'];
};

const isEpisode = (item: CalendarItem): item is Episode => item.type === 'episode';

// "4x01–08" within a season, "3x10–4x02" across one.
function numberRange(first: Episode, last: Episode) {
  const start = episodeNumber(first.episode, first.show.genres);
  if (first.episode.season !== last.episode.season) return `${start}–${episodeNumber(last.episode, last.show.genres)}`;
  return `${start}–${String(last.episode.number).padStart(2, '0')}`;
}

/**
 * The card for a grouped day: the first episode's artwork, the episode range as its number, the batch label as its
 * title, every episode type that's in it (a premiere and a finale on one drop), and the show's rating. Its link goes
 * to the season.
 */
export function toCalendarGroupCard({ group, label, clock }: { group: CalendarGroup; label: string; clock: Clock }):
  | CalendarGroupCard
  | undefined {
  const episodes = group.items.filter(isEpisode);
  const first = episodes.at(0);
  const last = episodes.at(-1);
  if (!first || !last || episodes.length < 2) return undefined;

  const base = toCalendarCard(first, clock);
  const { show } = first;
  const types = [...new Map(episodes.flatMap(({ episode }) => {
    const type = episodeType(episode);
    return type ? [[type.text, type] as const] : [];
  })).values()];

  return {
    ...base,
    key: group.key,
    href: `/shows/${show.ids.slug}/seasons/${first.episode.season}`,
    number: numberRange(first, last),
    title: label,
    rating: show.rating ?? undefined,
    tags: [
      ...types,
      { text: airTime(first.at, clock) },
      ...(show.network ? [{ text: show.network, kind: 'generic' as const }] : []),
    ],
    episodeBadge: undefined,
    group: {
      show: { id: show.ids.trakt, title: show.title, slug: show.ids.slug },
      season: first.episode.season,
      label,
      episodes: episodes.map(({ episode }) => ({
        id: episode.ids.trakt,
        season: episode.season,
        number: episode.number,
        label: episodeNumber(episode, show.genres),
        title: episode.title ?? '',
        href: `/shows/${show.ids.slug}/seasons/${episode.season}/episodes/${episode.number}`,
        rating: episode.rating ?? undefined,
      })),
    },
  };
}
