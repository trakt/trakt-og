import type { z } from 'zod/v4';
import type { CommentItem } from '../components/comments/CommentItem.ts';
import { commentItemOf } from '../components/comments/commentItemOf.ts';
import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import type { SpoilerTarget } from '../settings/SpoilerTarget.ts';
import type { RatingTarget } from '../components/rating/RatingTarget.ts';
import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { mediaImage } from '../images/mediaImage.ts';
import type { MediaImageSlot } from '../images/MediaImageSlot.ts';
import type { MediaImageType } from '../images/MediaImageType.ts';
import type { PreviewArtRef } from '../images/PreviewArtRef.ts';
import { previewArt } from '../images/previewArt.ts';
import type { subpageItemSchema } from './subpageItemSchema.ts';
import { seasonName } from '../utils/seasonName.ts';
import { toMovieLinks } from '../movies/toMovieLinks.ts';
import { toShowLinks } from '../shows/toShowLinks.ts';
import { toSeasonLinks } from '../shows/toSeasonLinks.ts';
import { toEpisodeLinks } from '../shows/toEpisodeLinks.ts';

type Body = z.infer<typeof subpageItemSchema>;

/** A step up for the tag bar; one without an href is the page's own, like a titled season's "Season 10". */
type Step = { readonly title: string; readonly href?: string };

/**
 * What a subpage (a comment, credits, stats, lists, comments) shows about its item: the header title, the sidebar
 * poster, Watch Now and the links out.
 */
export type SubpageMedia = {
  /** For the card: watched state, spoiler reveal and the share title. */
  readonly item: CommentItem;
  /** The h1: "Fight Club", "Season 1", "1x01 Pilot". */
  readonly title: string;
  /** An episode's number and name apart, so only the name hides behind the spoiler setting: "1x01", "Pilot". */
  readonly episodeNumber?: string;
  readonly episodeName?: string;
  readonly year?: number;
  readonly href: string;
  /** Hides the ratings and most counts before release. */
  readonly released?: string | null;
  readonly episodeType?: ReturnType<typeof episodeType>;
  /** The h2 above the title, for seasons and episodes: the show, then the season. */
  readonly parents: readonly Step[];
  /** After the title: the movie's or show's rating ("PG-13", "TV-MA"). */
  readonly certification?: string;
  /** A movie's or episode's scenes during and after the credits, for the tag bar. */
  readonly credits?: { readonly duringCredits?: boolean | null; readonly afterCredits?: boolean | null };
  readonly fanart?: string;
  readonly spoilerFanart?: string;
  readonly spoilerTarget?: SpoilerTarget;
  readonly poster?: string;
  /** The link preview's art, which falls back on a placeholder like no other image. */
  readonly preview?: string;
  /** The preview's poster alone, for a comment's. */
  readonly previewPoster?: string;
  readonly links: readonly ExternalLink[];
  /** The Watch Now dialog's header. Lists have no Watch Now. */
  readonly watchNow?: { readonly title: string; readonly year?: number };
  /** The poster's overlay badges, on movies and shows. */
  readonly ratingTarget?: RatingTarget;
};

type Params = {
  body: Body;
  /** The JustWatch link from the Watch Now rank, for movies, shows and seasons. */
  justwatch?: string | null;
  /** The official list a movie belongs to, as the first step up. */
  collection?: { readonly title: string; readonly href: string };
};

const yearOf = (date: string | null | undefined) => (date ? new Date(date).getUTCFullYear() : undefined);

/**
 * A subpage's view of its item, from `/comments/:id/item` or the summaries `loadSubpageMedia`
 * reads. `undefined` when the item is gone or isn't one og knows, which the page answers with a 404 like OG.
 */
export function toSubpageMedia({ body, justwatch, collection }: Params): SubpageMedia | undefined {
  const item = commentItemOf(body);
  if (!item) return undefined;
  const { movie, show, season, episode, list } = body;
  const spoilerTarget: SpoilerTarget | undefined =
    item.type === 'list'
      ? undefined
      : {
          type: item.type,
          id: item.id,
          season:
            (item.type === 'season' || item.type === 'episode') && show
              ? {
                  show: show.ids.trakt,
                  number: item.type === 'season' ? (season?.number ?? 0) : (episode?.season ?? 0),
                }
              : undefined,
        };
  const art = (type: PreviewArtRef['type'], id: number, slot: PreviewArtRef['slot']): PreviewArtRef => ({
    type,
    id,
    slot,
  });
  const previews = (header: readonly PreviewArtRef[], poster: readonly PreviewArtRef[]) => ({
    preview: previewArt(...header),
    previewPoster: previewArt(...poster),
  });
  const visible = (
    type: MediaImageType,
    id: number,
    slot: MediaImageSlot,
    size: 'medium' | 'full',
    fallback?: string,
  ) => mediaImage({ type, id, slot, size, fallback });

  if (item.type === 'movie' && movie) {
    return {
      item,
      spoilerTarget,
      title: movie.title,
      year: movie.year ?? undefined,
      href: `/movies/${movie.ids.slug}`,
      parents: collection ? [collection] : [],
      certification: movie.certification ?? undefined,
      credits: { duringCredits: movie.during_credits, afterCredits: movie.after_credits },
      released: movie.released,
      fanart: visible('movie', movie.ids.trakt, 'fanart', 'full'),
      poster: visible('movie', movie.ids.trakt, 'poster', 'medium'),
      ...previews(
        [art('movie', movie.ids.trakt, 'fanart'), art('movie', movie.ids.trakt, 'poster')],
        [art('movie', movie.ids.trakt, 'poster')],
      ),
      links: toMovieLinks({ movie, justwatch }),
      watchNow: { title: movie.title, year: movie.year ?? undefined },
      ratingTarget: { type: 'movie', id: movie.ids.trakt, title: item.title },
    };
  }
  if (item.type === 'list' && list) {
    const owner = list.user?.ids.slug;
    return {
      item,
      spoilerTarget,
      title: list.name,
      href: owner ? `/users/${owner}/lists/${list.ids.slug}` : `/lists/${list.ids.trakt}`,
      parents: [],
      links: [],
    };
  }
  if (!show) return undefined;

  const showHref = `/shows/${show.ids.slug}`;
  const watchNow = { title: show.title, year: show.year ?? undefined };
  const showFanart = visible('show', show.ids.trakt, 'fanart', 'full');
  const showPoster = visible('show', show.ids.trakt, 'poster', 'medium');
  const showArt = { fanart: art('show', show.ids.trakt, 'fanart'), poster: art('show', show.ids.trakt, 'poster') };

  if (item.type === 'show') {
    return {
      item,
      spoilerTarget,
      title: show.title,
      year: show.year ?? undefined,
      href: showHref,
      parents: [],
      certification: show.certification ?? undefined,
      released: show.first_aired,
      fanart: showFanart,
      poster: showPoster,
      ...previews([showArt.fanart, showArt.poster], [showArt.poster]),
      links: toShowLinks({ show, justwatch }),
      watchNow,
      ratingTarget: { type: 'show', id: show.ids.trakt, title: item.title },
    };
  }
  if (item.type === 'season' && season) {
    return {
      item,
      spoilerTarget,
      // A season with a title of its own goes by it, its number a step up in the tag bar, as on its summary.
      title: season.title || seasonName(season.number),
      year: yearOf(season.first_aired),
      href: `${showHref}/seasons/${season.number}`,
      parents: [
        { title: show.title, href: showHref },
        ...(season.title && season.title !== seasonName(season.number) ? [{ title: seasonName(season.number) }] : []),
      ],
      certification: show.certification ?? undefined,
      released: season.first_aired,
      fanart: showFanart,
      poster: visible('season', season.ids.trakt, 'poster', 'medium', showPoster),
      ...previews(
        [showArt.fanart, art('season', season.ids.trakt, 'poster'), showArt.poster],
        [art('season', season.ids.trakt, 'poster'), showArt.poster],
      ),
      links: toSeasonLinks({ show, number: season.number, justwatch }),
      watchNow,
    };
  }
  if (item.type === 'episode' && episode) {
    const seasonHref = `${showHref}/seasons/${episode.season}`;
    return {
      item,
      spoilerTarget,
      title: [episodeNumber(episode, null), episode.title?.trim()].filter(Boolean).join(' '),
      episodeNumber: episodeNumber(episode, null),
      episodeName: episode.title?.trim() || undefined,
      year: yearOf(episode.first_aired),
      href: `${seasonHref}/episodes/${episode.number}`,
      parents: [
        { title: show.title, href: showHref },
        { title: seasonName(episode.season), href: seasonHref },
        ...(season?.title && season.title !== seasonName(episode.season)
          ? [{ title: season.title, href: seasonHref }]
          : []),
      ],
      certification: show.certification ?? undefined,
      credits: { duringCredits: episode.during_credits, afterCredits: episode.after_credits },
      released: episode.first_aired,
      episodeType: episodeType(episode),
      fanart: visible('episode', episode.ids.trakt, 'screenshot', 'full', showFanart),
      spoilerFanart: showFanart,
      poster: showPoster,
      ...previews([art('episode', episode.ids.trakt, 'screenshot'), showArt.fanart, showArt.poster], [showArt.poster]),
      links: toEpisodeLinks({ show, episode }),
      watchNow,
    };
  }
  return undefined;
}
