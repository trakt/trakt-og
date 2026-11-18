const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 20;

type CreateRecentReadsParams = {
  ttlMs?: number;
  max?: number;
  now?: () => number;
};

/**
 * Browser reads kept in memory for a few minutes, so going Back, or opening the same page again, shows them at once
 * instead of reading again. A failed read is dropped, the oldest go past `max`, and a reload starts empty. For data
 * that can't be keyed on your own activity, such as someone else's profile.
 */
export function createRecentReads({ ttlMs = TTL_MS, max = MAX_ENTRIES, now = Date.now }: CreateRecentReadsParams = {}) {
  const entries = new Map<string, { at: number; value: Promise<unknown> }>();

  return {
    read<T>(key: string, start: () => Promise<T>): Promise<T> {
      const kept = entries.get(key);
      if (kept && now() - kept.at < ttlMs) return kept.value as Promise<T>;

      const value = start();
      entries.delete(key);
      entries.set(key, { at: now(), value });
      value.catch(() => {
        if (entries.get(key)?.value === value) entries.delete(key);
      });
      for (const oldest of entries.keys()) {
        if (entries.size <= max) break;
        entries.delete(oldest);
      }
      return value;
    },
    /** Drops everything, when the signed-in user changes. */
    forget: () => entries.clear(),
  };
}

/** The app's one in-memory store of recent reads. */
export const recentReads = createRecentReads();
