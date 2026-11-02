import type { SmartListDraft, SmartListPrivacy } from './SmartList.ts';

type Params = {
  request: (path: string, method: string, body: unknown) => Promise<Response>;
  /** The list's trakt id or slug. */
  list: string;
  name: string;
  privacy: SmartListPrivacy;
  draft: SmartListDraft;
};

/**
 * Turns one of the viewer's lists that stopped updating into a smart list from its ready-made setup. The list keeps
 * its address and fills itself from then on. Converting twice is fine: the API answers 200 the second time.
 */
export async function convertToSmartList({ request, list, name, privacy, draft }: Params) {
  const body = { name, privacy, source: draft.source, media_type: draft.mediaType, filters: draft.filters };
  const path = `/users/me/lists/${encodeURIComponent(list)}/smart-list-draft/convert`;
  const response = await request(path, 'POST', body).catch(() => null);
  if (response?.status === 420) return 'limit' as const;
  return response?.ok ? ('converted' as const) : ('failed' as const);
}
