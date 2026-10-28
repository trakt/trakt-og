import type { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import { emptyListMembership, withItemLists } from '../../overlay/listMembership.ts';
import type { ListTarget } from './ListTarget.ts';
import type { PickerList } from './PickerList.ts';

/** Reconcile fresh picker reads with the shared poster state, without writing to the cached record. */
export function syncPickerOverlay({
  overlay,
  target,
  lists,
  watchlisted,
}: {
  overlay: Pick<ReturnType<typeof createOverlay>, 'patch'>;
  target: ListTarget;
  lists: readonly PickerList[];
  watchlisted: boolean;
}) {
  overlay.patch(
    'listMembership',
    (data) =>
      withItemLists(data, {
        type: target.type,
        id: target.id,
        selected: lists.filter((list) => list.selected).map((list) => list.id),
        lists: lists.map(({ id, name, collaboration }) => ({ id, name, collaboration })),
      }),
    emptyListMembership(),
  );
  const type = target.type;
  overlay.patch(
    'watchlist',
    (data) => {
      const ids = new Set(data[type]);
      if (watchlisted) ids.add(target.id);
      else ids.delete(target.id);
      return { ...data, [type]: ids };
    },
    { movie: new Set(), show: new Set() },
  );
}
