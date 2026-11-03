import { z } from 'zod/v4';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { ShareClick } from './ShareClick.ts';
import { toShareClick } from './toShareClick.ts';

type RecordShareClickParams = {
  /** `viewerFetch()` in the browser: the click is the signed-in viewer's. */
  fetch: typeof globalThis.fetch;
  click: ShareClick;
};

const recorded = z.object({ outcome: z.enum(['recorded', 'duplicate', 'rejected']) });

type ShareClickOutcome = z.infer<typeof recorded>['outcome'];

/**
 * Credits the sharer with the viewer's visit, which feeds Trakt's "recommended by". The API rejects its own code and
 * pages it doesn't count as shareable; null is a failed request.
 */
export async function recordShareClick({ fetch, click }: RecordShareClickParams): Promise<ShareClickOutcome | null> {
  try {
    const response = await rawApiFetch({
      fetch,
      path: '/v3/shares/click',
      init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(click) },
    });
    if (!response.ok) return null;
    const parsed = recorded.safeParse(await response.json().catch(() => null));
    return parsed.success ? parsed.data.outcome : null;
  } catch {
    return null;
  }
}

/** `share.arrival`'s outcome, as trakt-web words it. */
export type ShareArrivalOutcome = ShareClickOutcome | 'uncredited' | 'anonymous' | 'failed';

type ShareArrivalParams = {
  /** `viewerFetch()` for a signed-in viewer, null for a signed-out one. */
  fetch: typeof globalThis.fetch | null;
  /** The page a shared link opened, `?share=` and all. */
  url: URL;
};

/** Records a visit through a shared link when it can credit the sharer, and says how it went. */
export async function recordShareArrival({ fetch, url }: ShareArrivalParams): Promise<ShareArrivalOutcome> {
  const click = toShareClick(url);
  if (!click) return 'uncredited';
  if (!fetch) return 'anonymous';
  return (await recordShareClick({ fetch, click })) ?? 'failed';
}
