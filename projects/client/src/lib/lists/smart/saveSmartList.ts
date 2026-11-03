import { z } from 'zod/v4';
import { AnalyticsEvent } from '$lib/analytics/AnalyticsEvent';
import { useTrack } from '$lib/analytics/useTrack';
import type { SmartListWrite } from './SmartList.ts';

type Params = {
  request: (path: string, method: string, body: unknown) => Promise<Response>;
  /** The list to update. Left out, a new one is made. */
  slug?: string;
  /** An update sends only what changed. */
  write: Partial<SmartListWrite>;
};

/** `limit`: the API's 420, the account holds as many smart lists as it may. */
type SaveSmartListResult = { ok: true; id?: number; slug: string } | { ok: false; reason: 'limit' | 'failed' };

const savedSchema = z.object({ ids: z.object({ trakt: z.number(), slug: z.string() }) });

const toBody = ({ name, privacy, source, mediaType, filters }: Partial<SmartListWrite>) => ({
  ...(name !== undefined && { name: name.trim() }),
  ...(privacy !== undefined && { privacy }),
  ...(source !== undefined && { source }),
  ...(mediaType !== undefined && { media_type: mediaType }),
  ...(filters !== undefined && { filters }),
});

/**
 * Makes a smart list or updates one of the viewer's own, and gives its ids back. An update keeps its slug, and the
 * API answers it with an empty 204 though its contract promises the list, so any success is a save.
 */
export async function saveSmartList({ request, slug, write }: Params): Promise<SaveSmartListResult> {
  const path = slug ? `/users/me/smart-lists/${encodeURIComponent(slug)}` : '/users/me/smart-lists';
  useTrack(slug ? AnalyticsEvent.SmartListUpdate : AnalyticsEvent.SmartListCreate).track();
  const response = await request(path, slug ? 'PUT' : 'POST', toBody(write)).catch(() => null);
  if (response?.status === 420) return { ok: false, reason: 'limit' };
  if (!response?.ok) return { ok: false, reason: 'failed' };
  if (slug) return { ok: true, slug };

  const saved = savedSchema.safeParse(await response.json().catch(() => null));
  if (!saved.success) return { ok: false, reason: 'failed' };
  return { ok: true, id: saved.data.ids.trakt, slug: saved.data.ids.slug };
}
