import { api } from '../../api/api.ts';
import { reorderApplied } from '../../lists/reorderApplied.ts';
import { REORDER_FAILED } from '../../lists/reorderFailed.ts';

/** The page patches its order before this write and restores it when this returns false. No media slice changes. */
export async function saveListOrder({
  fetch,
  rank,
  notify,
}: {
  fetch: typeof globalThis.fetch;
  rank: readonly number[];
  notify: { error: (message: string) => void };
}): Promise<boolean> {
  try {
    const response = await api({ fetch }).users.lists.reorder({ params: { id: 'me' }, body: { rank: [...rank] } });
    if (response.status < 200 || response.status >= 300) throw new Error(String(response.status));
    if (!reorderApplied(response.body)) throw new Error('Incomplete reorder');
    return true;
  } catch {
    notify.error(REORDER_FAILED);
    return false;
  }
}
