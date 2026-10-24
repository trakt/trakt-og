import type { SearchResultResponse } from '@trakt/api';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { formatDate } from '../../utils/formatDate.ts';
import { genreLabel } from '../../utils/genreLabel.ts';
import { episodeNumber } from '../media/episodeTags.ts';
import { personTags } from '../../people/personTags.ts';
import { imageUrl } from '../../utils/imageUrl.ts';
import { listPath } from '../../lists/listPath.ts';

/** One autocomplete row. */
export interface SearchRow {
  readonly key: string;
  readonly recent: { readonly query: string; readonly type: string; readonly id: number };
  readonly href: string;
  /** The show's title above an episode. */
  readonly topTitle?: string;
  readonly title: string;
  /** A movie's or show's year, beside the title. */
  readonly year?: string;
  /** OG's type tag: the model name, titleized. */
  readonly type: string;
  /** An episode's first-aired date, a list's owner or a person's birthday. */
  readonly tag?: string;
  /** Up to three genres ("Science Fiction"), joined in one pill. */
  readonly genres?: readonly string[];
  /** Separate pills after the genres: a list's size, a person's age and what they're known for. */
  readonly tags?: readonly string[];
  readonly poster?: string;
  /** A user's avatar, which OG drew square and round (`.poster.square`, `[data-type="users"]`), not a poster. */
  readonly avatar?: boolean;
}

const GENRE_LIMIT = 3;

const genres = (slugs: ReadonlyArray<string> | null | undefined) =>
  slugs?.length ? slugs.slice(0, GENRE_LIMIT).map(genreLabel) : undefined;

const year = (value: number | null | undefined) => (value ? String(value) : undefined);

const poster = (paths: ReadonlyArray<string> | null | undefined) => imageUrl(paths?.at(0), 'thumb');

type SearchList = NonNullable<SearchResultResponse['list']>;

// An official list has no owner to read, and a list that came without its slug keeps OG's id route.
const listHref = (list: SearchList) => {
  if (!list.ids.slug) return `/lists/${list.ids.trakt}`;
  if (list.type === 'official') return `/lists/official/${list.ids.slug}`;
  return list.user?.ids ? listPath(list) : `/lists/${list.ids.trakt}`;
};

/**
 * Maps a `/search` hit to the row OG drew for it, dating episodes in the viewer's order and zone. `today` (the viewer's
 * date, `YYYY-MM-DD`) gives people their age. Returns null for a hit missing the object its `type` names.
 */
export function toSearchRow(
  hit: SearchResultResponse,
  dates: Pick<DatePreferences, 'order' | 'timeZone'> = { order: 'mdy', timeZone: 'UTC' },
  today?: string,
): SearchRow | null {
  const { movie, show, episode, person, list } = hit;

  if (hit.type === 'movie' && movie) {
    return {
      key: `movie-${movie.ids.trakt}`,
      recent: { query: movie.title, type: 'movies', id: movie.ids.trakt },
      href: `/movies/${movie.ids.slug}`,
      title: movie.title,
      year: year(movie.year),
      type: 'Movie',
      genres: genres(movie.genres),
      poster: poster(movie.images?.poster),
    };
  }

  if (hit.type === 'show' && show) {
    return {
      key: `show-${show.ids.trakt}`,
      recent: { query: show.title, type: 'shows', id: show.ids.trakt },
      href: `/shows/${show.ids.slug}`,
      title: show.title,
      year: year(show.year),
      type: 'Show',
      genres: genres(show.genres),
      poster: poster(show.images?.poster),
    };
  }

  if (hit.type === 'episode' && episode && show) {
    return {
      key: `episode-${episode.ids.trakt}`,
      recent: { query: episode.title ?? '', type: 'episodes', id: episode.ids.trakt },
      href: `/shows/${show.ids.slug}/seasons/${episode.season}/episodes/${episode.number}`,
      topTitle: show.title,
      title: `${episodeNumber(episode, null)} ${episode.title ?? ''}`.trim(),
      type: 'Episode',
      tag: episode.first_aired ? formatDate(episode.first_aired, dates) : undefined,
      genres: genres(show.genres),
      poster: poster(show.images?.poster),
    };
  }

  if (hit.type === 'person' && person) {
    return {
      key: `person-${person.ids.trakt}`,
      recent: { query: person.name, type: 'people', id: person.ids.trakt },
      href: `/people/${person.ids.slug}`,
      title: person.name,
      type: 'Person',
      tags: personTags(person, { today, order: dates.order }),
      poster: poster(person.images?.headshot),
    };
  }

  if (hit.type === 'list' && list) {
    return {
      key: `list-${list.ids.trakt}`,
      recent: { query: list.name, type: list.type === 'official' ? 'official_lists' : 'lists', id: list.ids.trakt },
      href: listHref(list),
      title: list.name,
      type: list.type === 'official' ? 'Official List' : 'List',
      // Whose list it is, beside the type, then how big it is. Official lists have no owner.
      tag: list.user?.username ?? undefined,
      tags:
        typeof list.item_count === 'number'
          ? [`${list.item_count.toLocaleString('en-US')} ${list.item_count === 1 ? 'item' : 'items'}`]
          : undefined,
      poster: poster(list.images?.posters),
    };
  }

  return null;
}
