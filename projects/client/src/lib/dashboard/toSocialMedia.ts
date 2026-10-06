import type { SocialMedia } from './socialMediaSchema.ts';
import type { SocialItem } from './toSocialItem.ts';

const episodeCode = (season: number, number: number) =>
  season === 0 ? `Special ${number}` : `${season}x${String(number).padStart(2, '0')}`;

/** The part of a Social Feed item that says what it was about. */
export type SocialItemMedia = Pick<SocialItem, 'title' | 'episode' | 'code' | 'href' | 'still'>;

/** The movie, show, season or episode a feed row or a member's watching is about, with its page, poster and still. */
export function toSocialMedia(activity: SocialMedia): SocialItemMedia {
  if (activity.type === 'movie') {
    const { movie } = activity;
    const href = `/movies/${movie.ids.slug}`;
    return {
      title: { key: `movie:${movie.ids.slug}`, name: movie.title, href, poster: movie.images?.poster?.at(0) },
      href,
      still: movie.images?.fanart?.at(0),
    };
  }

  const { show } = activity;
  const showHref = `/shows/${show.ids.slug}`;
  const common = {
    title: { key: `show:${show.ids.slug}`, name: show.title, href: showHref, poster: show.images?.poster?.at(0) },
    still: show.images?.fanart?.at(0),
  };
  if (activity.type === 'show') return { ...common, href: showHref };
  if (activity.type === 'season') {
    const { number } = activity.season;
    return { ...common, code: number === 0 ? 'Specials' : `Season ${number}`, href: `${showHref}/seasons/${number}` };
  }

  const { season, number, images } = activity.episode;
  return {
    ...common,
    episode: { season, number },
    code: episodeCode(season, number),
    href: `${showHref}/seasons/${season}/episodes/${number}`,
    still: images?.screenshot?.at(0) ?? common.still,
  };
}
