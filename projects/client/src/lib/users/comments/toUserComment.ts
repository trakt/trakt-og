import { commentItemOf } from '../../components/comments/commentItemOf.ts';
import { episodeNumber } from '../../components/media/episodeTags.ts';
import { mediaImage } from '../../images/mediaImage.ts';
import type { UserComment } from './UserComment.ts';
import type { UserCommentRow } from './UserCommentRow.ts';
import { seasonName } from '../../utils/seasonName.ts';

type Poster = UserComment['poster'];

const showHref = (show: { readonly ids: { readonly slug: string } }) => `/shows/${show.ids.slug}`;
const seasonTitle = (season: { title?: string | null; number: number }) =>
  season.title?.trim() || seasonName(season.number);

function commentPoster(row: UserCommentRow): Poster | undefined {
  const { movie, show, season, episode, list } = row;

  if (row.type === 'movie' && movie) {
    return {
      type: 'movie',
      id: movie.ids.trakt,
      href: `/movies/${movie.ids.slug}`,
      title: movie.title,
      image: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'poster', size: 'thumb' }),
      variant: 'poster',
      rating: movie.rating ?? undefined,
      runtime: movie.runtime ?? undefined,
    };
  }
  if (row.type === 'show' && show) {
    return {
      type: 'show',
      id: show.ids.trakt,
      href: showHref(show),
      title: show.title,
      image: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'thumb' }),
      variant: 'poster',
      rating: show.rating ?? undefined,
      airedEpisodes: show.aired_episodes ?? undefined,
    };
  }
  if (row.type === 'season' && season && show) {
    return {
      type: 'season',
      id: season.ids.trakt,
      href: `${showHref(show)}/seasons/${season.number}`,
      title: seasonTitle(season),
      image: mediaImage({
        type: 'season',
        id: season.ids.trakt,
        slot: 'poster',
        size: 'thumb',
        fallback: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'thumb' }),
      }),
      variant: 'poster',
      show: { text: show.title, href: showHref(show) },
      seasonOf: { show: show.ids.trakt, number: season.number },
      rating: season.rating ?? undefined,
      airedEpisodes: season.aired_episodes ?? undefined,
    };
  }
  if (row.type === 'episode' && episode && show) {
    return {
      type: 'episode',
      id: episode.ids.trakt,
      href: `${showHref(show)}/seasons/${episode.season}/episodes/${episode.number}`,
      title: episode.title ?? '',
      number: episodeNumber(episode, show.genres),
      image: mediaImage({ type: 'episode', id: episode.ids.trakt, slot: 'screenshot', size: 'thumb' }),
      variant: 'screenshot',
      show: { text: show.title, href: showHref(show) },
      seasonOf: { show: show.ids.trakt, number: episode.season, episode: episode.number },
      rating: episode.rating ?? undefined,
      runtime: episode.runtime ?? show.runtime ?? undefined,
    };
  }
  // OG skipped comments on private lists.
  if (row.type === 'list' && list && list.privacy === 'public' && list.user?.ids.slug) {
    return {
      type: 'list',
      id: list.ids.trakt,
      href: `/users/${list.user.ids.slug}/lists/${list.ids.slug ?? list.ids.trakt}`,
      title: list.name,
      image: mediaImage({ type: 'list', id: list.ids.trakt, slot: 'poster', size: 'thumb' }),
      variant: 'poster',
    };
  }
  return undefined;
}

/** A user comment row as a comment beside its poster, or `null` for one OG wouldn't show. */
export function toUserComment(row: UserCommentRow): UserComment | null {
  const poster = commentPoster(row);
  const item = commentItemOf(row);
  if (!poster || !item) return null;

  const title = [poster.number, poster.title].filter(Boolean).join(' ');
  return {
    comment: row.comment,
    item,
    inlineTitle: poster.show ? `${poster.show.text}: ${title}` : title,
    poster,
  };
}
