import { episodeNumber } from '../../components/media/episodeTags.ts';
import { mediaImage } from '../../images/mediaImage.ts';
import { seasonName } from '../../utils/seasonName.ts';
import type { EpisodeChart } from './historyCharts.ts';
import type { HistoryItem } from './historyFilters.ts';
import type { HistoryRow } from './historyRowsSchema.ts';

/** The band naming the one title the history is narrowed to, with its fanart, year and way up. */
export type HistoryItemBand = {
  readonly type: HistoryItem['type'];
  readonly title: string;
  readonly href: string;
  readonly image?: string;
  /** A movie's, show's or episode's year, a season's "2012 - 2013". */
  readonly year?: string;
  /** A season's show, an episode's show and season, the line over the name, each linking to its own history. */
  readonly parents?: readonly { readonly title: string; readonly item: HistoryItem }[];
};

/** What the history rows don't carry: a season's air years, and an episode's season id for its history link. */
export type SeasonDetails = { readonly years?: string; readonly id?: number };

const showHref = (slug: string) => `/shows/${slug}`;
const yearOf = (value: number | string | null | undefined) =>
  typeof value === 'string' ? String(new Date(value).getUTCFullYear()) : value ? String(value) : undefined;

/**
 * The band off the first play, on its movie's or show's fanart, or an episode's own still. A season or episode names its
 * show (and an episode its season) over it.
 */
export function historyItemBand(
  item: HistoryItem,
  row: HistoryRow | EpisodeChart | undefined,
  season: SeasonDetails = {},
): HistoryItemBand | undefined {
  if (!row) return undefined;
  if ('movie' in row) {
    const { movie } = row;
    return {
      type: item.type,
      title: movie.title,
      href: `/movies/${movie.ids.slug}`,
      image: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'fanart', size: 'thumb' }),
      year: yearOf(movie.year),
    };
  }
  const { show, episode } = row;
  const fanart = mediaImage({ type: 'show', id: show.ids.trakt, slot: 'fanart', size: 'thumb' });
  const ofShow = { title: show.title, item: { type: 'show', id: show.ids.trakt } } as const;
  const seasonHref = `${showHref(show.ids.slug)}/seasons/${episode.season}`;
  switch (item.type) {
    case 'season':
      return {
        type: 'season',
        title: seasonName(episode.season),
        href: seasonHref,
        image: fanart,
        year: season.years,
        parents: [ofShow],
      };
    case 'episode': {
      const number = episodeNumber(episode, show.genres);
      return {
        type: 'episode',
        title: episode.title ? `${number} ${episode.title}` : number,
        href: `${seasonHref}/episodes/${episode.number}`,
        image: mediaImage({
          type: 'episode',
          id: episode.ids.trakt,
          slot: 'screenshot',
          size: 'thumb',
          fallback: fanart,
        }),
        year: yearOf(episode.first_aired),
        parents: [
          ofShow,
          ...(season.id
            ? [{ title: seasonName(episode.season), item: { type: 'season', id: season.id } } as const]
            : []),
        ],
      };
    }
    default:
      return {
        type: item.type,
        title: show.title,
        href: showHref(show.ids.slug),
        image: fanart,
        year: yearOf(show.year),
      };
  }
}
