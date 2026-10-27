import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import { readWatchNow } from './readWatchNow.ts';
import { offerSlugs, toSourceMap, toWatchNowButton } from './watchNow.ts';
import { watchNowOffersSchema, watchNowOrderSchema, watchNowSourcesSchema } from './watchNowSchema.ts';

type LoadWatchNowParams = {
  fetch: typeof fetch;
  /** The item's API path: `/movies/fight-club-1999`. */
  path: string;
  /** Where to look when the item has no sources: S1E1 for a show, like OG. */
  fallback?: string;
  country: string;
  settings: ViewerSettings | null;
};

/**
 * The sidebar Watch Now block for SSR: the item's offers in the viewer's country (with the JustWatch rank the
 * ratings strip shows), their ranking, and the country's service names and logos. The ranking comes without the
 * viewer's favorites, which go first from their settings instead. A client ID that may not call watch-now routes gets
 * an `unavailable` block, without the S1E1 retry.
 */
export async function loadWatchNow({ fetch, path, fallback, country, settings }: LoadWatchNowParams) {
  const load = (at: string) =>
    Promise.all([
      readWatchNow({
        fetch,
        path: `${at}/watchnow/${country}?extended=streaming_ranks`,
        schema: watchNowOffersSchema,
      }),
      readWatchNow({ fetch, path: `${at}/watchnow/favorites/${country}`, schema: watchNowOrderSchema }),
    ]);
  const sources = readWatchNow({ fetch, path: `/watchnow/sources/${country}`, schema: watchNowSourcesSchema });

  let [watchnow, order] = await load(path);
  const { unavailable } = watchnow;
  const rank = watchnow.data?.[country]?.streaming_ranks ?? null;
  let at = path;
  if (!unavailable && fallback && offerSlugs(watchnow.data?.[country]).length === 0) {
    at = fallback;
    [watchnow, order] = await load(fallback);
  }

  const favorites = settings?.browsing?.watchnow;
  return {
    rank,
    button: {
      ...toWatchNowButton({
        path: at,
        offers: watchnow.data?.[country] ?? null,
        order: order.data,
        sources: toSourceMap((await sources).data, country),
        country,
        favorites: favorites?.favorites ?? [],
        onlyFavorites: favorites?.only_favorites ?? false,
      }),
      unavailable,
    },
  };
}
