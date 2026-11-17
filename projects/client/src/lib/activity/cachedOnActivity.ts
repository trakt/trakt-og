import type { LastActivitiesResponse } from '@trakt/api';
import { activityCacheStorage } from './activityCacheStorage.ts';
import type { ReadLastActivities } from './createLastActivities.ts';

type CachedOnActivityParams<T> = {
  /** Which cache: one saved read per name. */
  name: string;
  /** The shared `last_activities` reader. */
  activities: ReadLastActivities;
  user: string;
  /** What moves the read: the activity fields it depends on and any other inputs, compared as JSON. */
  key: (activities: LastActivitiesResponse) => unknown;
  read: () => Promise<T>;
  /** How long a saved read lasts even when nothing moved, for what changes without any activity of yours. */
  maxAgeMs: number;
  storage?: ReturnType<typeof activityCacheStorage>;
  now?: () => number;
};

/**
 * A browser read kept between visits until your activity moves: the shared `last_activities` read decides whether
 * anything in `key` changed since the saved copy, which is reused for up to `maxAgeMs`. Otherwise `read` runs again.
 * When `last_activities` fails, `read` runs and nothing is saved.
 */
export async function cachedOnActivity<T>({
  name,
  activities,
  user,
  key,
  read,
  maxAgeMs,
  storage = activityCacheStorage(),
  now = Date.now,
}: CachedOnActivityParams<T>): Promise<T> {
  const latest = await activities().catch(() => null);
  const current = latest ? JSON.stringify(key(latest)) : null;
  const saved = current ? storage.load(name, user) : null;
  if (saved && saved.key === current && now() - saved.at < maxAgeMs) return saved.value as T;

  const value = await read();
  if (current) storage.save(name, { user, key: current, at: now(), value });
  return value;
}
