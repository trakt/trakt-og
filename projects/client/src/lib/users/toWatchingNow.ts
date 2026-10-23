import { imageUrl } from '../utils/imageUrl.ts';
import { episodeNumber } from '../components/media/episodeTags.ts';
import type { WatchingNow } from './WatchingNow.ts';

type Images = {
  readonly fanart?: readonly string[] | null;
  readonly screenshot?: readonly string[] | null;
} | null;
type Media = {
  readonly title?: string | null;
  readonly runtime?: number | null;
  readonly ids: { readonly slug?: string | null; readonly trakt: number };
  readonly images?: Images;
};

/** The fields of `GET /users/:id/watching?extended=full,images` the bar reads. */
export type WatchingResponse =
  & { readonly expires_at: string; readonly started_at: string; readonly action: string }
  & (
    | { readonly type: 'movie'; readonly movie?: Media | null }
    | {
      readonly type: 'episode';
      readonly show?: Media | null;
      readonly episode?: {
        readonly season: number;
        readonly number: number;
        readonly title?: string | null;
        readonly runtime?: number | null;
        readonly images?: Images;
      } | null;
    }
  );

/** OG's `full_runtime` fallbacks when the API has none. */
const DEFAULT_RUNTIME = { movie: 90, episode: 42 } as const;

export function toWatchingNow(watching: WatchingResponse): WatchingNow | null {
  const action = watching.action === 'checkin' ? 'checkin' : 'scrobble';
  const base = { action, endsAt: watching.expires_at } as const;

  if (watching.type === 'movie') {
    const movie = watching.movie;
    if (!movie) return null;

    return {
      ...base,
      title: movie.title ?? '',
      episode: null,
      href: `/movies/${movie.ids.slug ?? movie.ids.trakt}`,
      fanartUrl: fanart(movie.images),
      stillUrl: still(movie.images),
      runtime: movie.runtime || DEFAULT_RUNTIME.movie,
    };
  }

  const { show, episode } = watching;
  if (!show || !episode) return null;

  const showPath = `/shows/${show.ids.slug ?? show.ids.trakt}`;
  return {
    ...base,
    title: show.title ?? '',
    episode: { number: episodeNumber(episode, null), title: episode.title ?? '' },
    href: `${showPath}/seasons/${episode.season}/episodes/${episode.number}`,
    fanartUrl: fanart(show.images),
    stillUrl: imageUrl(episode.images?.screenshot?.at(0), 'medium') ?? still(show.images),
    runtime: episode.runtime || show.runtime || DEFAULT_RUNTIME.episode,
  };
}

function fanart(images: Images | undefined): string | null {
  return imageUrl(images?.fanart?.at(0), 'full') ?? null;
}

function still(images: Images | undefined): string | null {
  return imageUrl(images?.fanart?.at(0), 'medium') ?? null;
}
