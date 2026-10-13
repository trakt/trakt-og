import type { SocialMedia } from './socialMediaSchema.ts';
import type { SocialItem } from './toSocialItem.ts';

const episodeCode = (season: number, number: number) =>
  season === 0 ? `Special ${number}` : `${season}x${String(number).padStart(2, '0')}`;

/** The part of a Social Feed item that says what it was about. */
export type SocialItemMedia = Pick<SocialItem, 'title' | 'episode' | 'code' | 'href' | 'still' | 'target'>;

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
      title: { key: `movie:${movie.ids.slug}`, name: movie.title, href, poster: movie.images?.poster?.at(0), target },
      href,
      still: movie.images?.fanart?.at(0),
      target,
    };
  }

  const { show } = activity;
  const showHref = `/shows/${show.ids.slug}`;
  const target = targetOf('show', show);
  const common = {
    title: {
      key: `show:${show.ids.slug}`,
      name: show.title,
      href: showHref,
      poster: show.images?.poster?.at(0),
      target,
    },
    still: show.images?.fanart?.at(0),
    target,
  };
  if (activity.type === 'show') return { ...common, href: showHref };
  if (activity.type === 'season') {
    const { number } = activity.season;
    return { ...common, code: number === 0 ? 'Specials' : `Season ${number}`, href: `${showHref}/seasons/${number}` };
  }

  const { season, number, images, ids, rating, runtime, title } = activity.episode;
  return {
    ...common,
    target: {
      type: 'episode',
      id: ids.trakt,
      title: show.title,
      rating: rating ?? undefined,
      runtime: runtime ?? undefined,
      season: { show: show.ids.trakt, number: season, episode: number },
    },
    episode: { season, number, ...(title && { title }) },
    code: episodeCode(season, number),
    href: `${showHref}/seasons/${season}/episodes/${number}`,
    still: images?.screenshot?.at(0) ?? common.still,
  };
}
