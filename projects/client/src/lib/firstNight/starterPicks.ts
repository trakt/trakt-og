import { rawApiFetch } from '../api/rawApiFetch.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import { type StarterMedia, type StarterRow, starterRowsSchema } from './starterRowsSchema.ts';

/** `watched/all` is the most watched of all time, the titles most people have seen. */
export type StarterChart = 'popular' | 'trending' | 'anticipated' | 'watched/all';
export type StarterType = 'shows' | 'movies';

/** The one thing a row of picks asks for: add to history, or to the watchlist. */
export type PickAction = 'seen' | 'watchlist';

/** A chart title as a poster card with quick icons, so a new member can mark it seen or add it right there. */
export type StarterPick = {
  readonly key: string;
  readonly type: 'show' | 'movie';
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly year?: number;
  readonly image?: string;
  readonly fanart?: string;
  readonly released: boolean;
  readonly rating?: number;
  readonly runtime?: number;
  readonly airedEpisodes?: number;
};

// Popular rows are the bare title; the other charts wrap it with their counts.
function unwrap(row: StarterRow): StarterMedia {
  if ('show' in row) return row.show;
  if ('movie' in row) return row.movie;
  return row;
}

export function toStarterPick(media: StarterMedia, type: 'show' | 'movie', now: Date): StarterPick {
  const releaseDate = type === 'show' ? media.first_aired : media.released;
  return {
    key: `${type}:${media.ids.trakt}`,
    type,
    id: media.ids.trakt,
    href: `/${type}s/${media.ids.slug}`,
    title: media.title,
    year: media.year ?? undefined,
    image: imageUrl(media.images?.poster?.at(0), 'medium'),
    fanart: imageUrl(media.images?.fanart?.at(0), 'full'),
    released: releaseDate ? new Date(releaseDate) <= now : false,
    rating: media.rating ?? undefined,
    runtime: media.runtime ?? undefined,
    airedEpisodes: type === 'show' ? (media.aired_episodes ?? undefined) : undefined,
  };
}

type FetchStarterPicksParams = {
  fetch: typeof globalThis.fetch;
  chart: StarterChart;
  type: StarterType;
  limit: number;
  now?: Date;
};

/** A public chart, read without a token, as starter picks. An error comes back as no picks. */
export async function fetchStarterPicks({
  fetch,
  chart,
  type,
  limit,
  now = new Date(),
}: FetchStarterPicksParams): Promise<StarterPick[]> {
  const search = new URLSearchParams({ extended: 'full,images', limit: String(limit) });
  try {
    const response = await rawApiFetch({ fetch, path: `/${type}/${chart}?${search}` });
    if (!response.ok) return [];
    const rows = starterRowsSchema.safeParse(await response.json().catch(() => null));
    if (!rows.success) return [];
    return rows.data.map((row) => toStarterPick(unwrap(row), type === 'shows' ? 'show' : 'movie', now));
  } catch {
    return [];
  }
}

/** Two charts dealt alternately, a show then a movie, without repeats. */
export function interleave(first: readonly StarterPick[], second: readonly StarterPick[]): StarterPick[] {
  const longest = Math.max(first.length, second.length);
  return Array.from({ length: longest }, (_, i) => [first[i], second[i]])
    .flat()
    .filter((pick): pick is StarterPick => pick !== undefined);
}
