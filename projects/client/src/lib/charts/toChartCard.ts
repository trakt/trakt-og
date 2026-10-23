import { countLabel } from '../utils/countLabel.ts';
import { type DateOrder, formatDate } from '../utils/formatDate.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import type { ChartName } from './chartNames.ts';
import type { ChartMedia } from './chartRowSchema.ts';

// Trending sends `watchers`, anticipated `list_count`, favorited `user_count`, and watched, played and collected
// all four of the last. Shows' `collector_count` is owners, and their `collected_count` is episodes.
type Stats = {
  watchers?: number;
  list_count?: number;
  user_count?: number;
  watcher_count?: number;
  play_count?: number;
  collected_count?: number;
  collector_count?: number;
};

/** One chart row. Most charts send rows like this; popular rows are wrapped to match. */
export type ChartRow = ({ show: ChartMedia } | { movie: ChartMedia }) & Stats;

export type ChartCard = {
  type: 'show' | 'movie';
  id: number;
  href: string;
  title: string;
  year?: number;
  image?: string;
  /** The full-size fanart, for the podium. */
  fanart?: string;
  /** The title as artwork, for the podium. */
  logo?: string;
  /** Out by `now`. OG hid the rating of anything unreleased or undated . */
  released: boolean;
  rating?: number;
  airedEpisodes?: number;
  runtime?: number;
  /** The labels over the fanart. No kind is the red one. */
  tags: { text: string; kind?: 'list' | 'generic' | 'favorite' | 'collect' }[];
  /** The hero's details. */
  overview?: string;
  certification?: string;
  /** "Science Fiction", "Drama". */
  genres: string[];
  network?: string;
  /** A YouTube link. */
  trailer?: string;
};

type Tag = ChartCard['tags'][number];

// the premiere in the show's own zone, then the network.
function showTags(show: ChartMedia, order: DateOrder): Tag[] {
  const timeZone = show.airs?.timezone;
  return [
    ...(show.first_aired && timeZone
      ? [{ text: formatDate(show.first_aired, { format: 'LL', timeZone, order }) }]
      : []),
    ...(show.network ? [{ text: show.network, kind: 'generic' as const }] : []),
  ];
}

// `released` is a bare date, so it's formatted in UTC to keep the day.
function movieTags(movie: ChartMedia, order: DateOrder): Tag[] {
  return movie.released ? [{ text: formatDate(movie.released, { format: 'LL', timeZone: 'UTC', order }) }] : [];
}

const generic = (text: string): Tag => ({ text, kind: 'generic' });

// The `above_title` per action.
function tags(row: ChartRow, chart: ChartName, order: DateOrder): Tag[] {
  const watchers = countLabel(row.watcher_count ?? 0, 'watcher');
  const plays = countLabel(row.play_count ?? 0, 'play');

  switch (chart) {
    case 'trending':
      return [{ text: countLabel(row.watchers ?? 0, 'watcher') }];
    case 'popular':
    case 'recommendations':
      return [];
    case 'anticipated': {
      const list = { text: countLabel(row.list_count ?? 0, 'list'), kind: 'list' as const };
      return [list, ...('show' in row ? showTags(row.show, order) : movieTags(row.movie, order))];
    }
    case 'favorited': {
      const people = row.user_count ?? 0;
      return [{
        text: `${people.toLocaleString('en-US')} ${people === 1 ? 'person' : 'people'} favorited`,
        kind: 'favorite',
      }];
    }
    case 'watched':
      return [{ text: watchers }, generic(plays)];
    case 'played':
      return [{ text: plays }, generic(watchers)];
    case 'library':
      return 'show' in row
        ? [
          { text: countLabel(row.collected_count ?? 0, 'episode'), kind: 'collect' },
          generic(countLabel(row.collector_count ?? 0, 'owner')),
        ]
        : [{ text: countLabel(row.collected_count ?? 0, 'owner'), kind: 'collect' }];
  }
}

/**
 * Maps a chart row onto a fanart card. The chart decides which of the row's stats become tags. `now` decides whether
 * the item is out yet, and `order` is the viewer's date format.
 */
export function toChartCard(
  row: ChartRow,
  { chart, now, order }: { chart: ChartName; now: Date; order: DateOrder },
): ChartCard {
  const [type, media] = 'show' in row ? ['show' as const, row.show] : ['movie' as const, row.movie];
  const releaseDate = 'show' in row ? row.show.first_aired : row.movie.released;
  const released = releaseDate ? new Date(releaseDate) <= now : false;

  return {
    type,
    id: media.ids.trakt,
    href: `/${type}s/${media.ids.slug}`,
    title: media.title,
    year: media.year ?? undefined,
    image: imageUrl(media.images?.fanart?.at(0), 'thumb'),
    fanart: imageUrl(media.images?.fanart?.at(0), 'full'),
    logo: imageUrl(media.images?.logo?.at(0), 'medium'),
    released,
    rating: media.rating ?? undefined,
    runtime: media.runtime ?? undefined,
    airedEpisodes: 'show' in row ? (row.show.aired_episodes ?? undefined) : undefined,
    // Before release a card shows no counts: only the anticipated chart's list count, which is real anticipation.
    tags: released || chart === 'anticipated' ? tags(row, chart, order) : [],
    overview: media.overview?.trim() || undefined,
    certification: media.certification ?? undefined,
    genres: (media.genres ?? []).map(genreLabel),
    network: 'show' in row ? (row.show.network ?? undefined) : undefined,
    trailer: media.trailer ?? undefined,
  };
}
