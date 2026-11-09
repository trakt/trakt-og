import { episodeNumber } from '../../components/media/episodeTags.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { formatDate } from '../../utils/formatDate.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import { mediaImage } from '../../images/mediaImage.ts';
import type { HistoryCard } from '../history/toHistoryCard.ts';
import { episodeBadge } from '../profile/toProfileSummary.ts';
import type { LibraryRow, LibraryShowRow } from './libraryRowsSchema.ts';
import type { LibrarySortBy } from './librarySort.ts';
import { countLabel } from '../../utils/countLabel.ts';

type Link = { readonly text: string; readonly href: string };

/** One poster card in the library grid. */
export type LibraryCard = Omit<HistoryCard, 'watchedDate' | 'show' | 'subtitles'> & {
  /** The lines under the title. */
  readonly subtitles: readonly (string | Link)[];
};

type Options = {
  sortBy: LibrarySortBy;
  /** The Episodes tab's layout: the still, then the show. */
  screenshots: boolean;
  datePreferences: DatePreferences;
};

const showHref = (slug: string) => `/shows/${slug}`;
const votes = (count: number | null | undefined) => countLabel(count ?? 0, 'vote');

/** The sorted line OG put under the title. */
function sortLine(
  sortBy: LibrarySortBy,
  {
    collectedAt,
    released,
    runtime,
    count,
  }: {
    collectedAt: string;
    released?: string;
    runtime?: number | null;
    count?: number | null;
  },
  datePreferences: DatePreferences,
): string | undefined {
  switch (sortBy) {
    case 'added':
      return formatDate(collectedAt, { ...datePreferences, time: true });
    case 'released':
      return released;
    case 'runtime':
      return formatRuntime(runtime);
    case 'percentage':
    case 'votes':
      return votes(count);
    case 'title':
      return undefined;
  }
}

/** A movie or episode row as a card. */
export function toLibraryCard(row: LibraryRow, { sortBy, screenshots, datePreferences }: Options): LibraryCard {
  const common = { watchedAt: row.collected_at };
  if ('movie' in row) {
    const { movie } = row;
    const line = sortLine(
      sortBy,
      {
        collectedAt: row.collected_at,
        // A bare date, so it's formatted in UTC to keep the day.
        released: movie.released ? formatDate(movie.released, { ...datePreferences, timeZone: 'UTC' }) : undefined,
        runtime: movie.runtime,
        count: movie.votes,
      },
      datePreferences,
    );
    return {
      ...common,
      key: movie.ids.trakt,
      type: 'movie',
      id: movie.ids.trakt,
      href: `/movies/${movie.ids.slug}`,
      title: movie.title,
      image: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'poster', size: 'thumb' }),
      variant: 'poster',
      rating: movie.rating ?? undefined,
      runtime: movie.runtime ?? 0,
      subtitles: line ? [line] : [],
    };
  }

  const { episode, show } = row;
  const line = sortLine(
    sortBy,
    {
      collectedAt: row.collected_at,
      released: episode.first_aired ? formatDate(episode.first_aired, { ...datePreferences, time: true }) : undefined,
      count: episode.votes,
    },
    datePreferences,
  );
  return {
    ...common,
    key: episode.ids.trakt,
    type: 'episode',
    season: { show: show.ids.trakt, number: episode.season, episode: episode.number },
    id: episode.ids.trakt,
    href: `${showHref(show.ids.slug)}/seasons/${episode.season}/episodes/${episode.number}`,
    title: episode.title ?? '',
    number: episodeNumber(episode, show.genres),
    showTitle: show.title,
    image: screenshots
      ? mediaImage({ type: 'episode', id: episode.ids.trakt, slot: 'screenshot', size: 'thumb' })
      : mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'thumb' }),
    variant: screenshots ? 'screenshot' : 'poster',
    rating: episode.rating ?? undefined,
    episodeBadge: episodeBadge(episode),
    runtime: episode.runtime ?? show.runtime ?? 0,
    subtitles: [...(screenshots ? [{ text: show.title, href: showHref(show.ids.slug) }] : []), ...(line ? [line] : [])],
  };
}

/** A Shows tab card: "12 episodes", then the last collected date. */
export function toLibraryShowCard(row: LibraryShowRow, datePreferences: DatePreferences): LibraryCard {
  const { show } = row;
  const count = (row.seasons ?? []).reduce((sum, season) => sum + season.episodes.length, 0);
  return {
    key: show.ids.trakt,
    type: 'show',
    id: show.ids.trakt,
    href: showHref(show.ids.slug),
    title: show.title,
    image: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'thumb' }),
    variant: 'poster',
    rating: show.rating ?? undefined,
    airedEpisodes: show.aired_episodes ?? undefined,
    watchedAt: row.last_collected_at,
    runtime: 0,
    subtitles: [
      `${count} episode${count === 1 ? '' : 's'}`,
      formatDate(row.last_collected_at, { ...datePreferences, time: true }),
    ],
  };
}
