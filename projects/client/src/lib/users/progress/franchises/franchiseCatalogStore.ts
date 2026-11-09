import { z } from 'zod/v4';
import type { Franchise } from './Franchise.ts';

const KEY = 'og:franchise-catalog:v2';
const TTL = 24 * 60 * 60_000;

const stored = z.object({
  at: z.number(),
  franchises: z.array(
    z.object({
      id: z.number(),
      slug: z.string(),
      name: z.string(),
      movieIds: z.array(z.number()),
      likeCount: z.number(),
    }),
  ),
});

type FranchiseCatalogStoreParams = {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  now?: () => number;
};

/**
 * The franchise catalog kept in this browser for a day. Without storage (private mode, a full quota) it reads nothing
 * and writes nothing, and the page loads the catalog each visit.
 */
export function franchiseCatalogStore({ storage, now = Date.now }: FranchiseCatalogStoreParams = {}) {
  const store = () => storage ?? globalThis.localStorage;
  return {
    read(): readonly Franchise[] | null {
      try {
        const parsed = stored.safeParse(JSON.parse(store().getItem(KEY) ?? 'null'));
        return parsed.success && now() - parsed.data.at < TTL ? parsed.data.franchises : null;
      } catch {
        return null;
      }
    },
    write(franchises: readonly Franchise[]): void {
      try {
        store().setItem(KEY, JSON.stringify({ at: now(), franchises }));
      } catch {
        // The catalog just isn't kept.
      }
    },
  };
}
