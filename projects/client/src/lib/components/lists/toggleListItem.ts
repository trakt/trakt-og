import { z } from 'zod/v4';
import type { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import type { ListLabel } from '../../overlay/ListLabel.ts';
import { emptyListMembership, withListItems } from '../../overlay/listMembership.ts';
import type { ListTarget } from './ListTarget.ts';

type Params = {
  target: ListTarget;
  list: (ListLabel & { owner: string }) | null;
  remove: boolean;
  overlay: Pick<ReturnType<typeof createOverlay>, 'patch'>;
  request: (path: string, body: unknown) => Promise<Response>;
  notify: { success: (message: string) => void; error: (message: string) => void };
};
const resultSchema = z.object({ not_found: z.record(z.string(), z.array(z.unknown())).optional() });

/** Update every occurrence of this item, and restore its previous overlay when the write fails. */
export async function toggleListItem({ target, list, remove, overlay, request, notify }: Params) {
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
  const path = list ? `/users/${encodeURIComponent(list.owner)}/lists/${list.id}/items` : '/sync/watchlist';
  try {
    const response = await request(`${path}${remove ? '/remove' : ''}`, {
      [`${target.type}s`]: [{ ids: { trakt: target.id } }],
    });
    if (!response.ok) throw new Error(String(response.status));
    const result = resultSchema.parse(await response.json());
    if (Object.values(result.not_found ?? {}).some((items) => items.length > 0)) throw new Error('Item not found');
  } catch (error) {
    rollback();
    if (!(error instanceof Error) || error.message !== '429') notify.error("Doh! We couldn't update this list.");
    return false;
  }
  if (!list) {
    notify.success(`You ${remove ? 'removed' : 'added'} ${target.title} ${remove ? 'from' : 'to'} your watchlist.`);
  }
  return true;
}
