import { invalidateAll } from '$app/navigation';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { deleteList } from '../components/lists/deleteList.ts';
import type { ListRowActions } from '../components/media/ListRowActions.ts';
import { toast } from '../components/toast/toast.svelte.ts';
import { overlay } from '../overlay/overlay.ts';
import type { SummaryList } from '../summary/toSummaryList.ts';
import { type ActionList, itemListRowActions } from './itemListRowActions.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';

type Viewer = { readonly slug: string; readonly isVip: boolean } | null;
type ActionRow = ActionList & Pick<SummaryList, 'posters' | 'itemCount'>;
type Editor = { readonly id: number; readonly posters: readonly string[]; readonly count: number };

/**
 * The row icons for an item's lists, on its summary, its lists page and the search Lists tab: report, progress and share for everyone, and
 * the owner's edit, which opens the list editor, and delete, which takes the row away. The page renders `editor` with
 * `ListEditor` and shows `visible(lists)`.
 */
export function createItemListActions({ viewer, origin }: { viewer: () => Viewer; origin: () => string }) {
  let editor = $state<Editor>();
  let removed = $state<readonly number[]>([]);
  let deleting = $state<number | null>(null);

  async function removeList(list: ActionRow) {
    if (deleting !== null) return;
    deleting = list.id;
    const ok = await deleteList({
      id: list.id,
      overlay,
      notify: toast,
      request: (path, method) => rawApiFetch({ fetch: viewerFetch(), path, init: { method } }),
      remove: () => {
        removed = [...removed, list.id];
        return () => {
          removed = removed.filter((value) => value !== list.id);
        };
      },
    });
    deleting = null;
    if (ok) {
      void overlay.refresh();
      await invalidateAll();
    }
  }

  return {
    get editor() {
      return editor;
    },
    closeEditor: () => {
      editor = undefined;
    },
    visible: <T extends ActionRow>(lists: readonly T[]) => lists.filter(({ id }) => !removed.includes(id)),
    actions: (list: ActionRow): ListRowActions => {
      const result = itemListRowActions({ list, viewer: viewer(), origin: origin() });
      return {
        ...result,
        ...(result.edit && {
          edit: {
            onclick: () => {
              const posters = list.posters.flatMap(({ image }) => (image ? [image] : []));
              editor = { id: list.id, posters, count: list.itemCount };
            },
          },
        }),
        ...(result.delete && {
          delete: { onclick: () => removeList(list), busy: deleting !== null, warning: "This can't be undone!" },
        }),
      };
    },
  };
}
