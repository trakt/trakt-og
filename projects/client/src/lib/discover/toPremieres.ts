import type { CalendarShowResponse, ShowAnticipatedResponse } from '@trakt/api';
import { dayIn } from '../calendars/calendarDays.ts';
import { imageUrl } from '../utils/imageUrl.ts';

/** An upcoming premiere: a new series or a returning season, and how anticipated it is. */
export type Premiere = {
  readonly key: string;
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly logo?: string;
  readonly fanart?: string;
  /** When it airs, and that day (`YYYY-MM-DD`) in the viewer's time zone. */
  readonly at: string;
  readonly day: string;
  readonly kind: 'series' | 'season';
  readonly season: number;
  readonly network?: string;
  /** How many lists a new series is on (`/shows/anticipated`). */
  readonly lists?: number;
  readonly votes: number;
  /** A returning show's rating; a new series isn't out, so like OG it has none. */
  readonly rating?: number;
  readonly airedEpisodes?: number;
};

type PremieresParams = {
  /** The hot premieres feed: series and season premieres that are trending or anticipated. */
  premieres: readonly CalendarShowResponse[];
  /** The anticipated shows, for their list counts, and the new series due soon that the feed doesn't reach yet. */
  anticipated: readonly ShowAnticipatedResponse[];
  now: Date;
  /** The last day an anticipated series may premiere and still count as upcoming. */
  until: Date;
  timeZone: string;
};

// A returning season needs a following; a new series needs to be on lists or already rated.
const SEASON_VOTES = 1500;
const SERIES_LISTS = 300;
const SERIES_VOTES = 200;

const showCard = (show: CalendarShowResponse['show'], at: string, timeZone: string) => ({
  key: `show-${show.ids.trakt}`,
  id: show.ids.trakt,
  href: `/shows/${show.ids.slug}`,
  title: show.title,
  logo: imageUrl(show.images?.logo?.at(0), 'medium'),
  fanart: imageUrl(show.images?.fanart?.at(0), 'medium'),
  at,
  day: dayIn(at, timeZone),
  network: show.network ?? undefined,
  votes: show.votes ?? 0,
  airedEpisodes: show.aired_episodes ?? undefined,
});

/**
 * The upcoming premieres, most anticipated first: new series by how many lists they're on, returning seasons by how
 * many people rated the show. Each show once, only those still to air, and only with fanart.
 */
export function toPremieres({ premieres, anticipated, now, until, timeZone }: PremieresParams): Premiere[] {
  const lists = new Map(anticipated.map((row) => [row.show.ids.trakt, row.list_count]));
  const fromFeed = premieres.flatMap((row): Premiere[] => {
    const series = row.episode.episode_type === 'series_premiere';
    const count = lists.get(row.show.ids.trakt);
    const votes = row.show.votes ?? 0;
    const popular = series ? (count ?? 0) >= SERIES_LISTS || votes >= SERIES_VOTES : votes >= SEASON_VOTES;
    if (!popular) return [];
    return [{
      ...showCard(row.show, row.first_aired, timeZone),
      kind: series ? 'series' : 'season',
      season: row.episode.season,
      lists: series ? count : undefined,
      rating: series ? undefined : row.show.rating ?? undefined,
    }];
  });
  const fromAnticipated = anticipated.flatMap((row): Premiere[] => {
    const at = row.show.first_aired;
    if (!at || new Date(at) > until) return [];
    return [{ ...showCard(row.show, at, timeZone), kind: 'series', season: 1, lists: row.list_count }];
  });

  const all = [...fromFeed, ...fromAnticipated]
    .filter((premiere) => new Date(premiere.at) > now && premiere.fanart);
  const score = (premiere: Premiere) => premiere.lists ?? premiere.votes;
  return all
    .filter((premiere, index) => all.findIndex(({ key }) => key === premiere.key) === index)
    .toSorted((a, b) => score(b) - score(a));
}
