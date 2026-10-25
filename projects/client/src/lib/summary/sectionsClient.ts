import { type CommentResponse, commentResponseSchema, type ProfileResponse } from '@trakt/api';
import { z } from 'zod/v4';
import type { api } from '../api/api.ts';
import { contractSchema } from '../api/contractSchema.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { fetchWatching, type LiveWatch } from '../dashboard/fetchWatching.ts';
import type { SocialMember } from '../dashboard/toSocialItem.ts';
import { socialRowsSchema } from './socialRowsSchema.ts';
import type { SocialRow } from './SocialRow.ts';
import type { SummaryMedia } from './SummaryMedia.ts';
import { type ActivityTab, toActivity } from './toActivity.ts';
import type { RelatedPerson } from './RelatedPerson.ts';
import { type RelatedCard, toRelatedCard } from './toRelatedCard.ts';
import { toRelatedPeople } from './toRelatedPeople.ts';
import { type SummaryList, toSummaryList } from './toSummaryList.ts';
import { toVideoCards, type VideoCard } from '../videos/toVideoCards.ts';
import { okBody } from '../api/okBody.ts';

type Api = ReturnType<typeof api>;

// OG's `.limit(3)` comments and `summary_lists(limit: 3)`. OG's `related(6)` shows first, and more opens six at a time.
const PREVIEW_LIMIT = 3;
const RELATED_LIMIT = 18;
// Nothing related, popular titles in the first genre fill one row: six, and one more in case the title is among them.
const POPULAR_LIMIT = 7;
// The worker's page cap, so one call covers every followed member OG listed.
const SOCIAL_LIMIT = 250;

// `/users/me/following` rows, checked at the boundary: only the slug picks out followed members watching now.
const followingSchema = z.array(z.object({ user: z.object({ ids: z.object({ slug: z.string().nullish() }) }) }));

export type CommentTab = {
  readonly id: 'likes' | 'recent' | 'me';
  readonly label: string;
  readonly comments: readonly CommentResponse[];
};

type SectionsClientParams = {
  /** Public calls, without the viewer's token: they stay cacheable and a stale token can't 401 them. */
  anonymous: Api;
  /** Calls about the viewer, or filtered for them (blocked members' comments). */
  viewer: Api;
  /** The same fetch as `viewer`, for the routes `@trakt/api` has no contract for. */
  viewerFetch: typeof fetch;
  signedIn: boolean;
  now?: () => Date;
};

export type SectionsClient = {
  /** "People You Follow", or `null` when nobody is watching and no followed member has any activity. */
  activity: (media: SummaryMedia) => Promise<readonly ActivityTab[] | null>;
  /**
   * Popular, Recent and Me, in English unless `language` picks another (`null` is every language); Me is all the
   * viewer's own. Filtered to a language and empty, it's `[]`, so the section stays to switch languages; `null` only
   * when the item has no comments in any.
   */
  comments: (media: SummaryMedia, language?: string | null) => Promise<readonly CommentTab[] | null>;
  /** The official lists, then the most popular personal ones; the lists page sorts and filters the rest. */
  lists: (media: SummaryMedia) => Promise<readonly SummaryList[] | null>;
  /** Popular titles in `genre` when nothing is related, or `null` when there's neither. */
  related: (media: SummaryMedia, genre?: string) => Promise<readonly RelatedCard[] | null>;
  /** A related card's billed cast and key crew, to match against the summary's. */
  relatedPeople: (card: RelatedCard) => Promise<readonly RelatedPerson[] | null>;
  /** Every video that plays in the popup, newest first. */
  videos: (media: SummaryMedia) => Promise<readonly VideoCard[] | null>;
};

const nonEmpty = <T>(items: readonly T[]) => (items.length > 0 ? items : null);

/**
 * The lazy summary sections' reads, mapped for their components. Logged out, the calls about the viewer are skipped. Every failure
 * degrades to a missing tab, and a section with no tabs comes back `null`.
 */
export function sectionsClient({
  anonymous,
  viewer,
  viewerFetch,
  signedIn,
  now = () => new Date(),
}: SectionsClientParams): SectionsClient {
  const raw = async <T>(path: string, parse: (body: unknown) => T | null): Promise<T | null> => {
    if (!signedIn) return null;
    const response = await rawApiFetch({ fetch: viewerFetch, path }).catch(() => null);
    if (!response?.ok) return null;
    return parse(await response.json().catch(() => null));
  };
  const parsed =
    <T>(schema: { safeParse: (body: unknown) => { success: boolean; data?: T } }) =>
    (body: unknown) =>
      contractSchema(schema).safeParse(body).data ?? null;

  const mediaPath = (media: SummaryMedia) =>
    media.type === 'episode'
      ? `/shows/${media.slug}/seasons/${media.season}/episodes/${media.episode}`
      : media.type === 'season'
        ? `/shows/${media.slug}/seasons/${media.season}`
        : `/${media.type}s/${media.slug}`;

  const watching = (media: SummaryMedia) =>
    media.type === 'episode'
      ? okBody(
          anonymous.shows.episode.watching({
            params: { id: media.slug, season: media.season, episode: media.episode },
            query: {},
          }),
        )
      : watchingOther(media);
  const watchingOther = ({ type, slug, season }: SummaryMedia) =>
    type === 'season'
      ? okBody(anonymous.shows.season.watching({ params: { id: slug, season: season ?? 0 }, query: {} }))
      : type === 'movie'
        ? okBody(anonymous.movies.watching({ params: { id: slug }, query: {} }))
        : okBody(anonymous.shows.watching({ params: { id: slug }, query: {} }));

  const comments = (media: SummaryMedia, sort: 'likes' | 'newest', language: string | null) => {
    const { type, slug, season } = media;
    const request = {
      params: { id: slug, sort },
      query: { extended: 'images', limit: PREVIEW_LIMIT, ...(language && { language }) },
    } as const;
    if (media.type === 'episode') {
      return okBody(
        viewer.shows.episode.comments({
          ...request,
          params: { ...request.params, season: media.season, episode: media.episode },
        }),
      );
    }
    if (type === 'season') {
      return okBody(viewer.shows.season.comments({ ...request, params: { ...request.params, season: season ?? 0 } }));
    }
    return type === 'movie' ? okBody(viewer.movies.comments(request)) : okBody(viewer.shows.comments(request));
  };

  const lists = (media: SummaryMedia, kind: 'official' | 'personal', limit?: number) => {
    const { type, slug, season } = media;
    const request = {
      params: { id: slug, type: kind, sort: 'popular' },
      query: { extended: 'images', limit },
    } as const;
    if (media.type === 'episode') {
      return okBody(
        anonymous.shows.episode.lists({
          ...request,
          params: { ...request.params, season: media.season, episode: media.episode },
        }),
      );
    }
    if (type === 'season') {
      return okBody(anonymous.shows.season.lists({ ...request, params: { ...request.params, season: season ?? 0 } }));
    }
    return type === 'movie' ? okBody(anonymous.movies.lists(request)) : okBody(anonymous.shows.lists(request));
  };

  const videosOf = (media: SummaryMedia) => {
    const id = media.slug;
    if (media.type === 'episode') {
      return okBody(anonymous.shows.episode.videos({ params: { id, season: media.season, episode: media.episode } }));
    }
    if (media.type === 'season') return okBody(anonymous.shows.season.videos({ params: { id, season: media.season } }));
    return media.type === 'movie'
      ? okBody(anonymous.movies.videos({ params: { id } }))
      : okBody(anonymous.shows.videos({ params: { id } }));
  };

  const relatedOf = async (type: 'movie' | 'show', id: string, date: Date): Promise<readonly RelatedCard[]> => {
    const query = { extended: 'full,images', limit: RELATED_LIMIT } as const;
    if (type === 'movie') {
      const movies = await okBody(anonymous.movies.related({ params: { id }, query }));
      return (movies ?? []).map((item) => toRelatedCard({ type, item }, date));
    }
    const shows = await okBody(anonymous.shows.related({ params: { id }, query }));
    return (shows ?? []).map((item) => toRelatedCard({ type, item }, date));
  };

  const popularIn = async (type: 'movie' | 'show', genres: string, date: Date): Promise<readonly RelatedCard[]> => {
    const query = { extended: 'full,images', genres, limit: POPULAR_LIMIT } as const;
    if (type === 'movie') {
      const movies = await okBody(anonymous.movies.popular({ query }));
      return (movies ?? []).map((item) => toRelatedCard({ type, item }, date));
    }
    const shows = await okBody(anonymous.shows.popular({ query }));
    return (shows ?? []).map((item) => toRelatedCard({ type, item }, date));
  };

  // The slugs the viewer follows, or `null` logged out or when the list doesn't load: nobody is picked out then.
  const following = async (): Promise<ReadonlySet<string> | null> => {
    if (!signedIn) return null;
    // The contract omits limit, but the worker supports limit=all.
    const request = { params: { id: 'me' }, query: { extended: undefined, limit: 'all' } };
    const body = await okBody(viewer.users.following(request));
    const rows = followingSchema.safeParse(body).data;
    return rows ? new Set(rows.flatMap(({ user }) => user.ids.slug ?? [])) : null;
  };

  // What each followed member watching now is watching, for the dashboard's live cards.
  const liveOf = (everyone: readonly ProfileResponse[], followed: ReadonlySet<string> | null) => {
    const members: readonly SocialMember[] = everyone.flatMap(({ username, ids, images }) =>
      ids.slug && followed?.has(ids.slug)
        ? [
            {
              key: username,
              name: username,
              slug: ids.slug,
              href: `/users/${ids.slug}`,
              avatar: images?.avatar?.full ?? '',
            },
          ]
        : [],
    );
    if (members.length === 0) return Promise.resolve<readonly LiveWatch[]>([]);
    return fetchWatching({ get: (path) => rawApiFetch({ fetch: viewerFetch, path }), members }).catch(() => []);
  };

  return {
    activity: async (media) => {
      const [everyone, social, followed] = await Promise.all([
        watching(media),
        media.type === 'season'
          ? null
          : raw<readonly SocialRow[]>(
              `${mediaPath(media)}/social?limit=${SOCIAL_LIMIT}&extended=images`,
              parsed(socialRowsSchema),
            ),
        following(),
      ]);
      // A show's People Watched measures how much of it each member has seen, so it needs its size.
      const show =
        media.type === 'show' && media.airedEpisodes
          ? { airedEpisodes: media.airedEpisodes, totalRuntime: media.totalRuntime }
          : undefined;
      const live = await liveOf(everyone ?? [], followed);
      return nonEmpty(
        toActivity({
          watching: everyone ?? [],
          social,
          following: followed,
          live,
          show,
          item: { type: media.type, id: media.id },
        }),
      );
    },

    comments: async (media, language = 'en') => {
      const [likes, recent, mine] = await Promise.all([
        comments(media, 'likes', language),
        comments(media, 'newest', language),
        raw<readonly CommentResponse[]>(
          `${mediaPath(media)}/comments/mine?limit=${PREVIEW_LIMIT}&extended=images`,
          parsed(commentResponseSchema.array()),
        ),
      ]);
      const tabs: readonly CommentTab[] = [
        { id: 'likes', label: 'Popular', comments: likes ?? [] },
        { id: 'recent', label: 'Recent', comments: recent ?? [] },
        { id: 'me', label: 'Me', comments: mine ?? [] },
      ];
      const filled = tabs.filter((tab) => tab.comments.length > 0);
      return language ? filled : nonEmpty(filled);
    },

    lists: async (media) => {
      const [official, popular] = await Promise.all([
        lists(media, 'official'),
        lists(media, 'personal', PREVIEW_LIMIT),
      ]);
      // OG put the official lists (a movie's collection) ahead of the popular personal ones.
      return nonEmpty([...(official ?? []), ...(popular ?? [])].map(toSummaryList));
    },

    related: async (media, genre) => {
      if (media.type === 'season' || media.type === 'episode') return null;
      const date = now();
      const related = await relatedOf(media.type, media.slug, date);
      if (related.length > 0 || !genre) return nonEmpty(related);
      const popular = await popularIn(media.type, genre, date);
      return nonEmpty(popular.filter(({ id }) => id !== media.id).slice(0, POPULAR_LIMIT - 1));
    },

    relatedPeople: async (card) => {
      const params = { id: String(card.id) };
      const people =
        card.type === 'movie'
          ? await okBody(anonymous.movies.people({ params, query: {} }))
          : await okBody(anonymous.shows.people({ params, query: {} }));
      return people ? toRelatedPeople(people) : null;
    },

    videos: async (media) => {
      const videos = await videosOf(media);
      return nonEmpty(toVideoCards(videos ?? []));
    },
  };
}
