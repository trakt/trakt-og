import { redirect } from '@sveltejs/kit';
import { signInRedirect } from '../../auth/signInRedirect.ts';
import type { HeaderUser } from '../../components/header/HeaderUser.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import type { ProgressOptions } from './ProgressOptions.ts';
import { readProgressHide } from './progressHide.ts';
import { progressSort } from './progressSort.ts';
import { isProgressType, type ProgressType } from './progressTypes.ts';
import { positiveInt } from '../../utils/positiveInt.ts';

type Params = {
  locals: { token: string | null };
  params: { id: string; type?: string; sort?: string };
  url: URL;
  cookies: { get: (name: string) => string | undefined };
  parent: () => Promise<{
    profile: ProfileUser;
    isSelf: boolean;
    user: HeaderUser | null;
    settings: ViewerSettings | null;
    datePreferences: DatePreferences;
  }>;
};

/**
 * `/users/:id/progress(/:type)(/:sort_by/:sort_how)`: your own progress only. Someone else's goes to their profile,
 * and a signed-out viewer (or a token that stopped working) signs in and comes back. The rows load in the browser
 * from `/sync/progress/up_next_nitro` (`ProgressPage.svelte`), so this only reads the URL, the hide cookie and your
 * watched progress settings: sort, view, and the specials and next-episode choices the season lists use.
 */
export async function loadProgress({ locals, params, url, cookies, parent }: Params) {
  if (!locals.token) signInRedirect(url);

  const type: ProgressType = params.type && isProgressType(params.type) ? params.type : 'watched';
  const { profile, isSelf, user, settings, datePreferences } = await parent();
  if (!user) signInRedirect(url);
  if (!isSelf) redirect(302, `/users/${profile.slug}`);

  const saved = settings?.browsing?.progress?.watched;
  const options: ProgressOptions = {
    includeSpecials: Boolean(saved?.include_specials),
    useLastActivity: Boolean(saved?.use_last_activity),
  };
  const list = Number.parseInt(url.searchParams.get('list') ?? '', 10);

  return {
    type,
    sort: progressSort({ segments: params.sort, saved }),
    hide: readProgressHide({ cookie: cookies.get('filter-hide-progress'), search: url.searchParams, type }),
    grid: Boolean(saved?.grid_view),
    simple: Boolean(saved?.simple_progress),
    terms: url.searchParams.get('terms')?.trim() ?? '',
    list: list > 0 ? list : undefined,
    page: positiveInt(url.searchParams.get('page'), 1),
    options,
    datePreferences,
  };
}
