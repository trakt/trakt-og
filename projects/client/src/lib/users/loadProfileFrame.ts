import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { signInRedirect } from '../auth/signInRedirect.ts';
import { loadViewerLists } from './loadViewerLists.ts';
import { userStatsSchema } from '../stats/userStatsSchema.ts';
import { profileResponseSchema } from './profileResponseSchema.ts';
import { toViewerRelation } from './toViewerRelation.ts';
import { toProfileUser } from './toProfileUser.ts';
import { toWatchingNow } from './toWatchingNow.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';

type Params = {
  fetch: typeof fetch;
  locals: App.Locals;
  params: { id: string };
  parent: () => Promise<{ user: HeaderUser | null }>;
  url: URL;
};

/** The profile, its stats and the frame's watching-now bar. Neither of the last two is worth failing the page over. */
async function readFrame(client: ReturnType<typeof api>, id: string) {
  const [profile, stats, watching] = await Promise.all([
    client.users.profile({ params: { id }, query: { extended: 'full,vip' } }),
    client.users.stats({ params: { id } }).catch(() => null),
    client.users.watching({ params: { id }, query: { extended: 'full,images' } }).catch(() => null),
  ]);
  return { profile, stats, watching };
}

/**
 * The profile frame every `/users/:id/*` page shares. Subpage loaders `await parent()` and skip their own requests when
 * `profile.isLocked`: a private profile the viewer can't see renders the frame only, on every subpage.
 */
export async function loadProfileFrame({ fetch, locals, params, parent, url }: Params) {
  if (params.id === 'me' && !locals.token) {
    signInRedirect(url);
  }

  const client = api({ fetch, token: locals.token });
  const [viewerFrame, { user: viewer }] = await Promise.all([readFrame(client, params.id), parent()]);

  // A token that stopped working: `/users/me` signs in again, like OG with no session, and anyone else's profile
  // renders logged-out. The server never refreshes; the browser renews.
  const stale = viewerFrame.profile.status === 401 && locals.token !== null;
  if (stale && params.id === 'me') signInRedirect(url);
  const { profile, stats, watching } = stale ? await readFrame(api({ fetch }), params.id) : viewerFrame;
  if (profile.status === 404 || (profile.status === 200 && profile.body.deleted)) error(404, 'Page Not Found');
  if (profile.status !== 200) error(502, 'Trakt is having trouble loading this profile.');

  const parsed = profileResponseSchema.safeParse(profile.body);
  if (!parsed.success) error(502, 'Trakt returned an invalid profile response.');
  const user = toProfileUser(parsed.data);
  if (params.id !== user.slug) {
    redirect(
      params.id === 'me' ? 302 : 301,
      url.pathname.replace(`/users/${params.id}`, `/users/${user.slug}`) + url.search,
    );
  }

  const isSelf = viewer?.slug === user.slug;

  if (viewer && !isSelf) locals.viewerLists ??= loadViewerLists({ client });
  const parsedStats = stats?.status === 200 ? userStatsSchema.safeParse(stats.body) : null;
  const userStats = parsedStats?.success ? parsedStats.data : null;

  return {
    profile: user,
    /** The profile page's stat boxes and charts read it too. */
    stats: userStats,
    watching: watching?.status === 200 ? toWatchingNow(watching.body) : null,
    isSelf,
    signedIn: viewer !== null,
    // Streamed: the page renders without waiting for the viewer's five network lists.
    relation: viewer && !isSelf
      ? (locals.viewerLists?.then((lists) => toViewerRelation(user.slug, lists)) ?? null)
      : null,
  };
}
