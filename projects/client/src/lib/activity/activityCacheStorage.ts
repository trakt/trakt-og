const STORAGE_KEY = 'og-activity';

/** A saved read: whose it is, the activity key it was read at, and when. */
export type ActivityCacheEntry = { user: string; key: string; at: number; value: unknown };

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const localStorageOrNull = (): KeyValueStorage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

/**
 * Where reads cached on `last_activities` outlive the page: one localStorage entry holding the latest read per cache
 * name, for one user at a time. Every method swallows storage failures (private mode, blocked, full), so a failure
 * only means reading again.
 */
export function activityCacheStorage(storage: KeyValueStorage | null = localStorageOrNull()) {
  const quietly = <T>(task: () => T, fallback: T) => {
    try {
      return task();
    } catch {
      return fallback;
    }
  };
  const all = (): Record<string, ActivityCacheEntry> =>
    quietly(() => JSON.parse(storage?.getItem(STORAGE_KEY) ?? '{}') ?? {}, {});

  return {
    load: (name: string, user: string): ActivityCacheEntry | null => {
      const entry = all()[name];
      return entry?.user === user ? entry : null;
    },
    save: (name: string, entry: ActivityCacheEntry) => {
      // Another user's entries go when this one saves, so one browser never mixes people.
      const kept = Object.fromEntries(Object.entries(all()).filter(([, saved]) => saved.user === entry.user));
      quietly(() => storage?.setItem(STORAGE_KEY, JSON.stringify({ ...kept, [name]: entry })), undefined);
    },
    /** On sign-out, so the next person on this browser can't read it. */
    forget: () => quietly(() => storage?.removeItem(STORAGE_KEY), undefined),
  };
}
