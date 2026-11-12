import { error } from '@sveltejs/kit';
import { api } from '../../api/api.ts';
import type { PreviewSource } from '../../crawl/PreviewSource.ts';
import type { ProfileUser } from '../../users/ProfileUser.ts';
import { fetchListSummary } from '../fetchListSummary.ts';
import { fetchOfficialListSummary } from '../fetchOfficialListSummary.ts';
import type { ListCommentsTarget } from './ListCommentsTarget.ts';
import { toListCommentsSeo } from './toListCommentsSeo.ts';
import { toListCommentsTarget } from './toListCommentsTarget.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  target:
    | { kind: 'personal'; id: string; list: string }
    | { kind: 'official'; slug: string }
    | { kind: 'watchlist' | 'favorites'; profile: ProfileUser };
};

const readPersonal = (fetch: typeof globalThis.fetch, { id, list }: { id: string; list: string }) =>
  fetchListSummary(() =>
    api({ fetch }).users.lists.list.summary({ params: { id, list_id: list }, query: { extended: 'images' } }),
  );

async function readTarget({
  fetch,
  target,
}: Params): Promise<Pick<ListCommentsTarget, 'fullTitle' | 'description' | 'href'>> {
  if ('profile' in target) {
    const name = target.kind === 'watchlist' ? 'Watchlist' : 'Favorites';
    return {
      fullTitle: `${target.profile.displayName}'s ${name}`,
      href: `/users/${target.profile.slug}/${target.kind}`,
    };
  }

  const summary =
    target.kind === 'official'
      ? await fetchOfficialListSummary({ fetch, id: target.slug, query: { extended: 'images' } })
      : await readPersonal(fetch, target);
  if (!summary || [204, 401, 403, 404].includes(summary.status)) error(404, 'Page Not Found');
  if (summary.status !== 200) error(502, 'Trakt is having trouble loading this list.');
  if (target.kind === 'official' && summary.body.type !== 'official') error(404, 'Page Not Found');
  return toListCommentsTarget(summary.body);
}

/** A list's comments page for a link-preview bot: the list's summary alone, none for a watchlist or favorites. */
export async function loadListCommentsPreview(params: Params): Promise<PreviewSource> {
  const list = await readTarget(params);
  return { seo: toListCommentsSeo(list), title: list.fullTitle, href: list.href };
}
