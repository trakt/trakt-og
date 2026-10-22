import { reorderResultSchema } from './reorderResultSchema.ts';
import { listWriteError } from './listWriteError.ts';
import { listItemsPath } from './listItemsPath.ts';

type Params = {
  /** The owner's slug: collaborators write to the owner's path too. */
  owner: string;
  listId: number;
  /** List item ids: each takes its position as its rank. */
  rank: readonly number[];
  request: (path: string, body: unknown) => Promise<Response>;
  notify: { error: (message: string) => void };
  /** The toast for any failure, in place of the API's message. */
  failure?: string;
};

/**
 * `POST /users/:owner/lists/:id/items/reorder`. The page patches its
 * order first and restores it when this returns false. An id the list no longer has counts as a failure.
 */
export async function reorderListItems({ owner, listId, rank, request, notify, failure }: Params): Promise<boolean> {
  let response: Response | undefined;
  try {
    response = await request(`${listItemsPath(owner, listId)}/reorder`, { rank });
    if (response.ok && reorderResultSchema.parse(await response.json()).skipped_ids.length === 0) return true;
  } catch {
    // A network failure or an unexpected body gets the generic toast.
  }
  if (response?.status !== 429) notify.error(failure ?? await listWriteError(response));
  return false;
}
