import type { z } from 'zod/v4';
import { isApiUnavailable } from '../../api/isApiUnavailable.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';

type ReadWatchNowParams<T extends z.ZodType> = {
  /** SSR passes the load's; the browser uses its own. */
  fetch?: typeof globalThis.fetch;
  path: string;
  schema: T;
};

type WatchNowRead<T> = {
  /** Null for a failed, unreadable or malformed response. */
  readonly data: T | null;
  /** The client ID may not call watch-now routes, which are Official-only. */
  readonly unavailable: boolean;
};

/**
 * One watch-now read, parsed at the boundary. Every watch-now route is Official-gated and public, so none sends the
 * token.
 */
export async function readWatchNow<T extends z.ZodType>({
  fetch,
  path,
  schema,
}: ReadWatchNowParams<T>): Promise<WatchNowRead<z.output<T>>> {
  const response = await rawApiFetch({ fetch, path }).catch(() => null);
  if (!response?.ok) return { data: null, unavailable: isApiUnavailable(response) };

  const parsed = schema.safeParse(await response.json().catch(() => null));
  return { data: parsed.success ? parsed.data : null, unavailable: false };
}
