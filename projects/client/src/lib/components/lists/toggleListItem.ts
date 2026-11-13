import { z } from 'zod/v4';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import type { ToastAction } from '#lib/components/toast/toast.svelte.ts';
import { traktUrls } from '#lib/traktUrls.ts';
import { countLabel } from '#lib/utils/countLabel.ts';
import type { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import type { ListLabel } from '../../overlay/ListLabel.ts';
import { emptyListMembership, withListItems } from '../../overlay/listMembership.ts';
import type { ListTarget } from './ListTarget.ts';

type Params = {
  target: ListTarget;
  list: (ListLabel & { owner: string }) | null;
  /** The signed-in user's slug: an account limit on their own list offers VIP, on someone else's blames the owner's. */
  viewer?: string;
  remove: boolean;
  overlay: Pick<ReturnType<typeof createOverlay>, 'patch'>;
  request: (path: string, body: unknown) => Promise<Response>;
  notify: { success: (message: string) => void; error: (message: string, action?: ToastAction) => void };
};
type Failure = { message: string; action?: ToastAction };
type ListItemLimit = {
  error: z.infer<typeof limitErrorSchema>['error'];
  limit: number | null;
  own: boolean;
  vip: boolean;
};
const resultSchema = z.object({ not_found: z.record(z.string(), z.array(z.unknown())).optional() });
const limitErrorSchema = z.object({ error: z.enum(['list_item_limit_reached', 'total_list_item_limit_reached']) });
const { track: trackWatchlist } = useTrack(AnalyticsEvent.Watchlist);
const { track: trackList } = useTrack(AnalyticsEvent.List);
const { track: trackVipUpsell } = useTrack(AnalyticsEvent.VipUpsell);
const { track: trackVipUpsellImpression } = useTrack(AnalyticsEvent.VipUpsellImpression);
const VIP_SOURCE = 'lists';
const upgrade: ToastAction = {
  label: 'Upgrade',
  run: () => {
    trackVipUpsell({ source: VIP_SOURCE });
    globalThis.open(traktUrls.vipFor(VIP_SOURCE), '_blank', 'noopener');
  },
};

/** Update every occurrence of this item, and restore its previous overlay when the write fails. */
export async function toggleListItem({ target, list, viewer, remove, overlay, request, notify }: Params) {
  const update = (ids: ReadonlySet<number>, selected: boolean) => {
    const next = new Set(ids);
    if (selected) next.add(target.id);
    else next.delete(target.id);
    return next;
  };
  const rollback = list
    ? overlay.patch(
        'listMembership',
        (data) => withListItems(data, { list, items: [target], add: !remove }),
        emptyListMembership(),
      )
    : overlay.patch(
        'watchlist',
        (data) => ({ ...data, [target.type]: update(data[target.type] ?? new Set(), !remove) }),
        { movie: new Set(), show: new Set() },
      );
  const action = remove ? 'remove' : 'add';
  if (list) trackList({ action });
  else if (target.type !== 'episode') trackWatchlist({ action });
  const path = list ? `/users/${encodeURIComponent(list.owner)}/lists/${list.id}/items` : '/sync/watchlist';
  let failure: Failure = { message: "Doh! We couldn't update this list." };
  try {
    const response = await request(`${path}${remove ? '/remove' : ''}`, {
      [`${target.type}s`]: [{ ids: { trakt: target.id } }],
    });
    if (response.status === 420 && list) failure = (await limitFailure(response, list.owner === viewer)) ?? failure;
    if (!response.ok) throw new Error(String(response.status));
    const result = resultSchema.parse(await response.json());
    if (Object.values(result.not_found ?? {}).some((items) => items.length > 0)) throw new Error('Item not found');
  } catch (error) {
    rollback();
    if (!(error instanceof Error) || error.message !== '429') {
      notify.error(failure.message, failure.action);
      if (failure.action === upgrade) trackVipUpsellImpression({ source: VIP_SOURCE });
    }
    return false;
  }
  if (!list) {
    notify.success(`You ${remove ? 'removed' : 'added'} ${target.title} ${remove ? 'from' : 'to'} your watchlist.`);
  }
  return true;
}

export function listItemLimitFailure({ error, limit, own, vip }: ListItemLimit): Failure {
  const items = limit ? countLabel(limit, 'item') : 'the most items';
  if (error === 'list_item_limit_reached') return { message: `This list already holds ${items}.` };
  if (!own) return { message: `This list's owner has already added ${items} to their lists.` };
  return { message: `You've already added ${items} to your lists.`, ...(vip ? {} : { action: upgrade }) };
}

async function limitFailure(response: Response, own: boolean) {
  const body = limitErrorSchema.safeParse(await response.json().catch(() => null));
  if (!body.success) return null;
  const limit = Number(response.headers.get('x-account-limit'));
  return listItemLimitFailure({
    error: body.data.error,
    limit: Number.isFinite(limit) ? limit : null,
    own,
    vip: response.headers.get('x-vip-user') !== 'false',
  });
}
