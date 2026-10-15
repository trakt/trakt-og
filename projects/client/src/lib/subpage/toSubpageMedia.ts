import type { z } from 'zod/v4';
import type { CommentItem } from '../components/comments/CommentItem.ts';
import { commentItemOf } from '../components/comments/commentItemOf.ts';
import { episodeType } from '../components/media/episodeTags.ts';
import type { SpoilerTarget } from '../settings/SpoilerTarget.ts';
import type { RatingTarget } from '../components/rating/RatingTarget.ts';
import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { iconLinks } from '../components/summary/iconLinks.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import type { subpageItemSchema } from './subpageItemSchema.ts';

type Body = z.infer<typeof subpageItemSchema>;
type Show = NonNullable<Body['show']>;

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

const IMDB = 'https://www.imdb.com/';
const TMDB = 'https://www.themoviedb.org/';

const yearOf = (date: string | null | undefined) => (date ? new Date(date).getUTCFullYear() : undefined);
const seasonName = (number: number) => (number === 0 ? 'Specials' : `Season ${number}`);
const sxe = (season: number, number: number) =>
  season === 0 ? `Special ${number}` : `${season}x${String(number).padStart(2, '0')}`;
const find = (q: string, s: string) => `${IMDB}find?${new URLSearchParams({ q, s })}`;
// OG's DuckDuckGo "!wikipedia" query for seasons and episodes: "Breaking Bad 2008 TV Series Season 1".
const showQuery = (show: Show) => `${show.title}${show.year ? ` ${show.year}` : ''} TV Series`;

const onlyLinks = (links: readonly (ExternalLink | false)[]) => links.filter((link) => link !== false);

// External links from `imdb_url`, `tmdb_url`, `tvdb_url` and `fanart_url`.
function movieLinks(movie: NonNullable<Body['movie']>, justwatch: string | null | undefined): ExternalLink[] {
  const { ids } = movie;
  return [
    ...onlyLinks([
      !!movie.homepage && { label: 'Official Site', href: movie.homepage },
      { label: 'IMDB', href: ids.imdb ? `${IMDB}title/${ids.imdb}` : find(movie.title, 'tt') },
      !!ids.tmdb && { label: 'TMDB', href: `${TMDB}movie/${ids.tmdb}` },
      !!ids.tmdb && { label: 'Fanart.tv', href: `https://fanart.tv/movie/${ids.tmdb}` },
    ]),
    ...iconLinks({
      social: movie.social_ids,
      justwatch,
      search: `${movie.year ? `${movie.title} ${movie.year}` : movie.title} Movie`,
    }),
  ];
}

function showLinks(show: Show, justwatch: string | null | undefined): ExternalLink[] {
  const { ids } = show;
  return [
    ...onlyLinks([
      !!show.homepage && { label: 'Official Site', href: show.homepage },
      { label: 'IMDB', href: ids.imdb ? `${IMDB}title/${ids.imdb}` : find(show.title, 'tt') },
      !!ids.tmdb && { label: 'TMDB', href: `${TMDB}tv/${ids.tmdb}` },
      !!ids.tvdb && { label: 'TVDB', href: `https://www.thetvdb.com/dereferrer/series/${ids.tvdb}` },
      !!ids.tvdb && { label: 'Fanart.tv', href: `https://fanart.tv/series/${ids.tvdb}` },
    ]),
    ...iconLinks({ social: show.social_ids, justwatch, search: showQuery(show) }),
  ];
}

function seasonLinks(show: Show, number: number, justwatch: string | null | undefined): ExternalLink[] {
  const { ids } = show;
  return [
    {
      label: 'IMDB',
      href: ids.imdb
        ? `${IMDB}title/${ids.imdb}/episodes?season=${number}`
        : find(`${show.title} season ${number}`, 'tt'),
    },
    ...onlyLinks([!!ids.tmdb && { label: 'TMDB', href: `${TMDB}tv/${ids.tmdb}/season/${number}` }]),
    ...iconLinks({ social: null, justwatch, search: `${showQuery(show)} Season ${number}` }),
  ];
}

function episodeLinks(show: Show, episode: NonNullable<Body['episode']>): ExternalLink[] {
  const title = episode.title?.trim() ?? '';
  return [
    {
      label: 'IMDB',
      href: episode.ids.imdb ? `${IMDB}title/${episode.ids.imdb}` : find(`${show.title} ${title}`.trim(), 'ep'),
    },
    ...onlyLinks([
      !!show.ids.tmdb && {
        label: 'TMDB',
        href: `${TMDB}tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}`,
      },
    ]),
    ...iconLinks({ social: null, search: `${showQuery(show)}${title ? ` ${title}` : ''}` }),
  ];
}

/**
 * A subpage's view of its item, from `/comments/:id/item` or the summaries `loadSubpageMedia`
 * reads. `undefined` when the item is gone or isn't one og knows, which the page answers with a 404 like OG.
 */
export function toSubpageMedia({ body, justwatch, collection }: Params): SubpageMedia | undefined {
  const item = commentItemOf(body);
  if (!item) return undefined;
  const { movie, show, season, episode, list } = body;
  const spoilerTarget: SpoilerTarget | undefined = item.type === 'list' ? undefined : {
    type: item.type,
    id: item.id,
    season: (item.type === 'season' || item.type === 'episode') && show
      ? { show: show.ids.trakt, number: item.type === 'season' ? season?.number ?? 0 : episode?.season ?? 0 }
      : undefined,
  };
  const fanart = (path: string | null | undefined) => imageUrl(path, 'full');
  const poster = (path: string | null | undefined) => imageUrl(path, 'medium');

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
      fanart: fanart(movie.images?.fanart?.at(0)),
      poster: poster(movie.images?.poster?.at(0)),
      links: movieLinks(movie, justwatch),
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
  const showFanart = fanart(show.images?.fanart?.at(0));
  const showPoster = poster(show.images?.poster?.at(0));

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
      links: showLinks(show, justwatch),
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
      poster: poster(season.images?.poster?.at(0)) ?? showPoster,
      links: seasonLinks(show, season.number, justwatch),
      watchNow,
    };
  }
  if (item.type === 'episode' && episode) {
    const seasonHref = `${showHref}/seasons/${episode.season}`;
    return {
      item,
      spoilerTarget,
      title: [sxe(episode.season, episode.number), episode.title?.trim()].filter(Boolean).join(' '),
      episodeNumber: sxe(episode.season, episode.number),
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
      fanart: fanart(episode.images?.screenshot?.at(0)) ?? showFanart,
      spoilerFanart: showFanart,
      poster: showPoster,
      links: episodeLinks(show, episode),
      watchNow,
    };
  }
  return undefined;
}
