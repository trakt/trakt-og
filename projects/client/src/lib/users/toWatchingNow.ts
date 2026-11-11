import { mediaImage } from '../images/mediaImage.ts';
import { episodeNumber } from '../components/media/episodeTags.ts';
import type { WatchingNow } from './WatchingNow.ts';

type Media = {
  readonly title?: string | null;
  readonly runtime?: number | null;
  readonly ids: { readonly slug?: string | null; readonly trakt: number };
};

/** The fields of `GET /users/:id/watching?extended=full` the bar reads. */
export type WatchingResponse = { readonly expires_at: string; readonly started_at: string; readonly action: string } & (
  | { readonly type: 'movie'; readonly movie?: Media | null }
  | {
      readonly type: 'episode';
      readonly show?: Media | null;
      readonly episode?: {
        readonly ids: { readonly trakt: number };
        readonly season: number;
        readonly number: number;
        readonly title?: string | null;
        readonly runtime?: number | null;
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
      item: { type: 'movie', id: movie.ids.trakt },
      showId: null,
      title: movie.title ?? '',
      episode: null,
      href: `/movies/${movie.ids.slug ?? movie.ids.trakt}`,
      fanartUrl: art('movie', movie.ids.trakt, 'full'),
      stillUrl: art('movie', movie.ids.trakt, 'medium'),
      runtime: movie.runtime || DEFAULT_RUNTIME.movie,
    };
  }

  const { show, episode } = watching;
  if (!show || !episode) return null;

  const showPath = `/shows/${show.ids.slug ?? show.ids.trakt}`;
  return {
    ...base,
    item: { type: 'episode', id: episode.ids.trakt },
    showId: show.ids.trakt,
    title: show.title ?? '',
    episode: { number: episodeNumber(episode, null), title: episode.title ?? '' },
    href: `${showPath}/seasons/${episode.season}/episodes/${episode.number}`,
    fanartUrl: art('show', show.ids.trakt, 'full'),
    stillUrl: mediaImage({
      type: 'episode',
      id: episode.ids.trakt,
      slot: 'screenshot',
      size: 'medium',
      fallback: art('show', show.ids.trakt, 'medium'),
    }),
    runtime: episode.runtime || show.runtime || DEFAULT_RUNTIME.episode,
  };
}

const art = (type: 'movie' | 'show', id: number, size: 'medium' | 'full') =>
  mediaImage({ type, id, slot: 'fanart', size });
