import type { LastActivitiesResponse } from '@trakt/api';

/** Your `last_activities`, or null when the read failed. */
export type ReadLastActivities = () => Promise<LastActivitiesResponse | null>;

type CreateLastActivitiesParams = {
  get: (path: string) => Promise<Response>;
  now?: () => number;
};

// Readers starting within this window share one request, so a page load reads it once.
const SHARE_MS = 10_000;

// Loaded on first read, so the contract schema stays out of the boot bundle.
const loadParser = () => import('./parseLastActivities.ts');

/**
 * One shared reader of `/sync/last_activities` for everything in the browser that decides whether its data moved: the
 * overlay, og's own stats, and whatever caches on it next. Reads within a few seconds share one request; a failed
 * read isn't shared, so the next one retries. `forget` drops it when the user changes.
 */
export function createLastActivities({ get, now = Date.now }: CreateLastActivitiesParams) {
  let latest: { at: number; read: Promise<LastActivitiesResponse | null> } | null = null;

  const fetchOnce = async () => {
    const [response, parser] = await Promise.all([get('/sync/last_activities').catch(() => null), loadParser()]);
    if (!response?.ok) return null;
    return parser.parseLastActivities(await response.json().catch(() => null));
  };

  const read: ReadLastActivities = () => {
    if (latest && now() - latest.at < SHARE_MS) return latest.read;
    const pending = fetchOnce().catch(() => null);
    const entry = { at: now(), read: pending };
    latest = entry;
    pending.then((activities) => {
      if (!activities && latest === entry) latest = null;
    });
    return pending;
  };

  return {
    read,
    forget: () => {
      latest = null;
    },
  };
}
