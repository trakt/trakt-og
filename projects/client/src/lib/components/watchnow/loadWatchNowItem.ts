import { GENERIC_ERROR } from '../../utils/genericError.ts';
import { fetchWatchNow } from './fetchWatchNow.ts';
import { fetchWatchNowShared } from './fetchWatchNowShared.ts';
import { readWatchNow } from './readWatchNow.ts';
import {
  justWatchLinksSchema,
  watchNowCountriesSchema,
  type WatchNowCountry,
  type WatchNowOffers,
  watchNowOffersSchema,
} from './watchNowSchema.ts';

const RATE_LIMITED = "Doh! Trakt's API is rate limiting your requests. Try again in a few minutes.";

type LoadWatchNowItemParams = {
  fetch?: typeof globalThis.fetch;
  /** The item's API path: `/movies/fight-club-1999`. */
  path: string;
  /** Where its JustWatch links live: an episode's are its season's. */
  justwatchPath: string;
  /** Whether the browser has a connection: a read that got no answer while online is taken for a Cloudflare block. */
  online?: boolean;
};

type WatchNowItem =
  | { readonly failed: true; readonly message: string }
  | {
      readonly failed: false;
      readonly offers: WatchNowOffers | null;
      /** The client ID may not call watch-now routes. */
      readonly unavailable: boolean;
      readonly countries: WatchNowCountry[];
      readonly justwatch: Record<string, string | null | undefined>;
    };

/**
 * What the Watch Now modal shows for one item: its offers in every country, the country list and its JustWatch
 * pages. An offers read that fails for any reason but an Official-only client ID is `failed`, not an item with no
 * offers, with the toast that says why. og's reads only meet Cloudflare's rate limit, which answers without CORS
 * headers, so the browser can't read its 429 or `Retry-After`: a read with no answer while online is taken for one.
 */
export async function loadWatchNowItem({
  fetch,
  path,
  justwatchPath,
  online = globalThis.navigator?.onLine !== false,
}: LoadWatchNowItemParams): Promise<WatchNowItem> {
  const [all, countries, justwatch] = await Promise.all([
    readWatchNow({ fetch, path: `${path}/watchnow`, schema: watchNowOffersSchema }),
    fetchWatchNowShared({ fetch, path: '/watchnow/countries', schema: watchNowCountriesSchema }),
    fetchWatchNow({ fetch, path: `${justwatchPath}/watchnow/justwatch_links`, schema: justWatchLinksSchema }),
  ]);
  if (all.rateLimited || (all.unanswered && online)) return { failed: true, message: RATE_LIMITED };
  if (all.data === null && !all.unavailable) return { failed: true, message: GENERIC_ERROR };

  return {
    failed: false,
    offers: all.data,
    unavailable: all.unavailable,
    countries: countries ?? [],
    justwatch: justwatch ?? {},
  };
}
