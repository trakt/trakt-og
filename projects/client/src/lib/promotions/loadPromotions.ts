import { sharedCache } from '../utils/sharedCache.ts';
import type { KeyedCache } from '../utils/sharedCache.ts';
import { fetchPromotions } from './fetchPromotions.ts';
import { parsePromotions } from './parsePromotions.ts';
import type { Promotion } from './Promotion.ts';

const TTL_SECONDS = 300;

type LoadPromotionsParams = {
  fetch: typeof globalThis.fetch;
  cache: KeyedCache | undefined;
  origin: string;
};

/** The promotions running or about to start, kept in the data center's cache for five minutes. Never throws. */
export async function loadPromotions({ fetch, cache, origin }: LoadPromotionsParams): Promise<Promotion[]> {
  try {
    return await sharedCache({
      cache,
      key: `${origin}/_cache/promotions`,
      ttlSeconds: TTL_SECONDS,
      parse: (value) => (Array.isArray(value) ? parsePromotions(value) : null),
      load: () => fetchPromotions(fetch),
    });
  } catch {
    return [];
  }
}
