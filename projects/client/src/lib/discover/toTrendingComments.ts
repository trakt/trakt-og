import type { CommentResponse } from '@trakt/api';
import { episodeNumber } from '../components/media/episodeTags.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import type { TrendingCommentRow } from './trendingCommentRowsSchema.ts';

/** One trending comment: the comment, and the movie or show it's about, as a poster card. */
export type TrendingComment = {
  readonly comment: CommentResponse;
  readonly href: string;
  readonly item: {
    readonly type: 'movie' | 'show';
    readonly id: number;
    readonly href: string;
    readonly title: string;
    readonly year?: number;
    /** An episode's comment: the card shows the episode, as history does, with its show under it. */
    readonly episode?: { readonly number: string; readonly title: string; readonly href: string };
    readonly poster?: string;
    readonly fanart?: string;
    readonly rating?: number;
    readonly released: boolean;
    readonly airedEpisodes?: number;
    readonly runtime?: number;
  };
};

function toItem(row: TrendingCommentRow, now: Date): TrendingComment['item'] | undefined {
  const type = row.movie ? 'movie' : row.show ? 'show' : undefined;
  const media = row.movie ?? row.show;
  if (!type || !media) return undefined;
  if (row.type !== 'movie' && row.type !== 'show' && row.type !== 'episode') return undefined;

  const released = type === 'movie' ? media.released : media.first_aired;
  const episode = row.type === 'episode' && row.episode ? row.episode : undefined;
  return {
    type,
    id: media.ids.trakt,
    href: `/${type}s/${media.ids.slug}`,
    title: media.title,
    year: media.year ?? undefined,
    ...(episode && {
      episode: {
        number: episodeNumber(episode, media.genres),
        title: episode.title?.trim() ?? '',
        href: `/shows/${media.ids.slug}/seasons/${episode.season}/episodes/${episode.number}`,
      },
    }),
    poster: imageUrl(media.images?.poster?.at(0), 'thumb'),
    fanart: imageUrl(media.images?.fanart?.at(0), 'full'),
    rating: media.rating ?? undefined,
    released: released ? new Date(released) <= now : false,
    airedEpisodes: media.aired_episodes ?? undefined,
    runtime: media.runtime ?? undefined,
  };
}

/**
 * The trending comments to show, most liked first as the API sends them, but one per title before any second one,
 * so a big episode night doesn't fill the section with one show. Only movies, shows and episodes, with a poster.
 */
export function toTrendingComments(rows: readonly TrendingCommentRow[], now: Date, limit = 10): TrendingComment[] {
  const comments = rows.flatMap((row): TrendingComment[] => {
    const item = toItem(row, now);
    return item?.poster ? [{ comment: row.comment, href: `/comments/${row.comment.id}`, item }] : [];
  });
  const key = ({ item }: TrendingComment) => `${item.type}-${item.id}`;
  const firsts = comments.filter((comment, index) =>
    comments.findIndex((other) => key(other) === key(comment)) === index
  );
  return [...firsts, ...comments.filter((comment) => !firsts.includes(comment))].slice(0, limit);
}
