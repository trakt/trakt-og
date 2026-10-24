import { reorderApplied } from '../../lists/reorderApplied.ts';
import { REORDER_FAILED } from '../../lists/reorderFailed.ts';

/** The page patches its order before this write and restores it when this returns false. No media slice changes. */
export async function saveListOrder({
  rank,
  request,
  notify,
}: {
  rank: readonly number[];
  request: (path: string, body: unknown) => Promise<Response>;
  notify: { error: (message: string) => void };
}): Promise<boolean> {
  try {
    const response = await request('/users/me/lists/reorder', { rank });
    if (!response.ok) throw new Error(String(response.status));
    if (!reorderApplied(await response.json())) throw new Error('Incomplete reorder');
    return true;
  } catch {
    notify.error(REORDER_FAILED);
    return false;
  }
}
