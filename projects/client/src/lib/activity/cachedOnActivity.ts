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
  /**
   * Whether a saved read, by the key it was saved with, may be shown at all. For a cache that holds one saved read
   * while its inputs vary (a month of a calendar), so a read for other inputs is never shown in place of this one.
   */
  accepts?: (savedKey: string) => boolean;
  /**
   * Given, a saved read comes back at once, without waiting on `last_activities`, and the fresh read arrives here
   * once the check finds the key moved.
   */
  onUpdate?: (value: T) => void;
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
  accepts,
  onUpdate,
  storage = activityCacheStorage(),
  now = Date.now,
}: CachedOnActivityParams<T>): Promise<T> {
  const saved = storage.load(name, user);
  const usable = saved && now() - saved.at < maxAgeMs && (accepts?.(saved.key) ?? true) ? saved : null;

  const refresh = async () => {
    const latest = await activities().catch(() => null);
    const current = latest ? JSON.stringify(key(latest)) : null;
    if (usable && usable.key === current) return { value: usable.value as T, moved: false };

    const value = await read();
    if (current) storage.save(name, { user, key: current, at: now(), value });
    return { value, moved: true };
  };

  if (usable && onUpdate) {
    refresh().then(
      ({ value, moved }) => moved && onUpdate(value),
      () => {},
    );
    return usable.value as T;
  }
  return (await refresh()).value;
}
