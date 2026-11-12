import { api } from '../api/api.ts';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { loadListCommentsPreview } from '../lists/comments/loadListCommentsPreview.ts';
import { loadBuiltInListPreview } from '../lists/loadBuiltInListPreview.ts';
import { loadListPreview } from '../lists/loadListPreview.ts';
import { loadSmartListPreview } from '../lists/smart/loadSmartListPreview.ts';
import { toLockedProfileSeo } from '../seo/pages/toLockedProfileSeo.ts';
import { toProfileSeo } from '../seo/pages/toProfileSeo.ts';
import { staticSeo } from '../seo/pages/staticSeo.ts';
import type { SeoMeta } from '../seo/SeoMeta.ts';
import { apiUserStats } from '../stats/apiUserStats.ts';
import { toUserCommentsSeo } from './comments/toUserCommentsSeo.ts';
import { toHistorySeo } from './history/toHistorySeo.ts';
import { historyFilters, itemHistoryType } from './history/historyFilters.ts';
import { type HistoryType, isHistoryType } from './history/historyTypes.ts';
import { toLibrarySeo } from './library/toLibrarySeo.ts';
import { loadProfilePreview } from './loadProfilePreview.ts';
import { toNetworkSeo } from './network/toNetworkSeo.ts';
import type { NetworkType } from './network/networkTypes.ts';
import { toNotesSeo } from './notes/toNotesSeo.ts';
import type { ProfileUser } from './ProfileUser.ts';
import { ratingQuery } from './ratings/ratingQuery.ts';
import { toRatingsSeo } from './ratings/toRatingsSeo.ts';
import { toUserListsSeo } from './lists/toUserListsSeo.ts';
import type { ListsMode } from './lists/ListsMode.ts';
import type { userCommentMediaTypes } from './comments/userCommentMediaTypes.ts';
import type { noteTypes } from './notes/noteTypes.ts';

type Context = {
  fetch: typeof fetch;
  params: Partial<Record<string, string>>;
  url: URL;
  profile: ProfileUser;
};

type Head = (context: Context) => SeoMeta | PreviewSource | Promise<SeoMeta | PreviewSource>;

const isPreviewSource = (found: SeoMeta | PreviewSource): found is PreviewSource => 'seo' in found;

/** The profile page's head. Their About text is the description, so the stats are read only without one. */
async function profileHead({ fetch, params, profile }: Context): Promise<SeoMeta> {
  const stats = profile.about
    ? null
    : apiUserStats(
        await api({ fetch })
          .users.stats({ params: { id: params.id ?? '' } })
          .catch(() => null),
      );
  return { ...toProfileSeo({ profile, stats }), noindex: profile.isPrivate };
}

const listsHead =
  (mode: ListsMode): Head =>
  ({ profile }) =>
    toUserListsSeo({ profile, mode });

const listCommentsHead =
  (kind: 'watchlist' | 'favorites'): Head =>
  async ({ fetch, profile }) =>
    (await loadListCommentsPreview({ fetch, target: { kind, profile } })).seo;

const builtInHead =
  (kind: 'watchlist' | 'favorites'): Head =>
  async ({ fetch, url, profile }) =>
    (await loadBuiltInListPreview({ fetch, url, kind, profile })).seo;

const HEADS: Readonly<Record<string, Head>> = {
  '/users/[id]': profileHead,
  // Only your own progress has a page; anyone else's goes to their profile.
  '/users/[id]/progress/[[type=progressType]]/[...sort]': profileHead,
  '/users/[id]/history/[[type=historyType]]/[...sort]': ({ params, url, profile }) => {
    const requested: HistoryType = params.type && isHistoryType(params.type) ? params.type : 'all';
    const { item } = historyFilters(url.searchParams, requested, 'UTC');
    return toHistorySeo({ profile, type: item ? itemHistoryType(item) : requested });
  },
  '/users/[id]/library/[[type=historyType]]/[...sort]': ({ params, profile }) =>
    toLibrarySeo({ profile, type: params.type && isHistoryType(params.type) ? params.type : 'all' }),
  '/users/[id]/ratings/[[type=ratingType]]/[...filters]': ({ params, profile }) =>
    toRatingsSeo({
      profile,
      type: ratingQuery(params.type ? `${params.type}/${params.filters ?? ''}` : params.filters).type,
    }),
  '/users/[id]/notes/[[type=noteType]]': ({ params, profile }) =>
    toNotesSeo({ profile, type: (params.type ?? 'all') as keyof typeof noteTypes }),
  '/users/[id]/network/[[type=networkType]]/[[sort=networkSort]]': ({ params, profile }) => {
    const requested = (params.type ?? 'following') as NetworkType;
    // Pending follows are your own to see; anyone else gets Following.
    return toNetworkSeo({ profile, type: requested === 'following_pending' ? 'following' : requested });
  },
  '/users/[id]/comments/[[comment_type=userCommentType]]/[[type=userCommentMediaType]]/[[sort_by=userCommentSort]]': ({
    params,
    profile,
  }) =>
    toUserCommentsSeo({
      profile,
      type: (params.type ?? 'all') as keyof typeof userCommentMediaTypes,
      liked: false,
    }),
  // The comments you liked are yours: a signed-out visitor signs in.
  '/users/[id]/comments/liked': () => staticSeo['/signin'],
  '/users/[id]/lists': listsHead('personal'),
  '/users/[id]/smart-lists': listsHead('smart'),
  '/users/[id]/lists/collaborations': listsHead('collaborations'),
  '/users/[id]/lists/liked': listsHead('liked'),
  '/users/[id]/lists/liked/official': listsHead('liked-official'),
  '/users/[id]/lists/[list]': ({ fetch, url, params, profile }) =>
    loadListPreview({ fetch, url, id: params.id ?? '', list: params.list ?? '', profile }),
  '/users/[id]/lists/[list]/comments': ({ fetch, params }) =>
    loadListCommentsPreview({ fetch, target: { kind: 'personal', id: params.id ?? '', list: params.list ?? '' } }),
  '/users/[id]/smart-lists/[slug]': ({ fetch, params }) =>
    loadSmartListPreview({ fetch, id: params.id ?? '', slug: params.slug ?? '' }),
  '/users/[id]/watchlist/[[type]]': builtInHead('watchlist'),
  '/users/[id]/watchlist/comments': listCommentsHead('watchlist'),
  '/users/[id]/favorites/[[type]]': builtInHead('favorites'),
  '/users/[id]/favorites/comments': listCommentsHead('favorites'),
};

type Params = Omit<Context, 'profile'> & { routeId: string };

/**
 * A member page's head for a link-preview bot, from the member's profile and whatever the page itself reads for its
 * head: one read for most, the stats too on a profile without an About text. A private profile shows the name alone,
 * on every page, as it does to a signed-out visitor.
 */
export async function loadUserPreview({ routeId, ...context }: Params): Promise<PreviewSource> {
  // `/users/me` is the viewer's own: a signed-out visitor signs in.
  if (context.params.id === 'me') return { seo: staticSeo['/signin'], title: 'Sign in', href: '/signin' };

  const profile = await loadProfilePreview({ fetch: context.fetch, id: context.params.id ?? '' });
  const href = `/users/${profile.slug}`;
  const base = { title: profile.displayName, href };
  if (profile.isLocked) return { seo: toLockedProfileSeo(profile), ...base };

  const found = await (HEADS[routeId] ?? profileHead)({ ...context, profile });
  return isPreviewSource(found) ? found : { seo: found, ...base };
}
