import { api } from '../../api/api.ts';
import type { SmartList } from './SmartList.ts';
import { toSmartList } from './toSmartList.ts';

type Params = { fetch: typeof globalThis.fetch; token: string | null; user: string };

/**
 * A user's smart lists, newest first as the API sends them, or null when they didn't load. The token shows the
 * owner their private and friends-only lists; everyone else gets what the owner lets them see.
 */
export async function fetchSmartLists({ fetch, token, user }: Params): Promise<readonly SmartList[] | null> {
  const response = await api({ fetch, token })
    .users.smartLists.personal({ params: { id: user } })
    .catch(() => null);
  return response?.status === 200 ? response.body.map(toSmartList) : null;
}
