import type { SocialMedia } from './socialMediaSchema.ts';
import { episodeNumber } from '../components/media/episodeTags.ts';
import type { SocialItem } from './toSocialItem.ts';
import { mediaImage } from '../images/mediaImage.ts';
import { seasonName } from '../utils/seasonName.ts';

/** The part of a Social Feed item that says what it was about. */
export type SocialItemMedia = Pick<SocialItem, 'title' | 'episode' | 'code' | 'href' | 'still' | 'fanart' | 'target'>;

type Ids = {
  readonly ids: { readonly trakt: number };
  readonly rating?: number | null;
  readonly runtime?: number | null;
};

const targetOf = (type: 'movie' | 'show', item: Ids & { title: string; aired_episodes?: number | null }) => ({
  type,
  id: item.ids.trakt,
  title: item.title,
  rating: item.rating ?? undefined,
  runtime: item.runtime ?? undefined,
  airedEpisodes: item.aired_episodes ?? undefined,
});

/** The movie, show, season or episode a feed row or a member's watching is about, with its page, poster and still. */
export function toSocialMedia(activity: SocialMedia): SocialItemMedia {
  if (activity.type === 'movie') {
    const { movie } = activity;
    const href = `/movies/${movie.ids.slug}`;
    const target = targetOf('movie', movie);
    return {
      title: {
        key: `movie:${movie.ids.slug}`,
        name: movie.title,
        href,
        poster: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'poster', size: 'thumb' }),
        target,
      },
      href,
      still: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'fanart', size: 'medium' }),
      fanart: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'fanart', size: 'medium' }),
      target,
    };
  }

  const { show } = activity;
  const showHref = `/shows/${show.ids.slug}`;
  const target = targetOf('show', show);
  const showFanart = mediaImage({ type: 'show', id: show.ids.trakt, slot: 'fanart', size: 'medium' });
  const common = {
    title: {
      key: `show:${show.ids.slug}`,
      name: show.title,
      href: showHref,
      poster: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'thumb' }),
      target,
    },
    still: showFanart,
    fanart: showFanart,
    target,
  };
  if (activity.type === 'show') return { ...common, href: showHref };
  if (activity.type === 'season') {
    const { number } = activity.season;
    return { ...common, code: seasonName(number), href: `${showHref}/seasons/${number}` };
  }

  const { season, number, ids, rating, runtime, title } = activity.episode;
  return {
    ...common,
    target: {
      type: 'episode',
      id: ids.trakt,
      title: show.title,
      rating: rating ?? undefined,
      runtime: runtime ?? show.runtime ?? undefined,
      season: { show: show.ids.trakt, number: season, episode: number },
    },
    episode: { season, number, ...(title && { title }) },
    code: episodeNumber({ season, number }, null),
    href: `${showHref}/seasons/${season}/episodes/${number}`,
    still: mediaImage({ type: 'episode', id: ids.trakt, slot: 'screenshot', size: 'medium', fallback: showFanart }),
  };
}
