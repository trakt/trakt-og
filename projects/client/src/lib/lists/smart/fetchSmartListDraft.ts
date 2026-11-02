import { api } from '../../api/api.ts';
import { readSmartListTarget } from './readSmartListTarget.ts';
import type { SmartListDraft } from './SmartList.ts';

type Params = { fetch: typeof globalThis.fetch; token: string; list: string };

/**
 * The ready-made smart list setup for one of the viewer's lists that stopped updating, or null when it has none,
 * it was already converted, or it didn't load.
 */
export async function fetchSmartListDraft({ fetch, token, list }: Params): Promise<SmartListDraft | null> {
  const response = await api({ fetch, token })
    .users.lists.list.smartListDraft({ params: { id: 'me', list_id: list } })
    .catch(() => null);
  if (response?.status !== 200 || response.body.converted) return null;

  const { filters, confidence } = response.body;
  return { ...readSmartListTarget(response.body), filters, confidence };
}
