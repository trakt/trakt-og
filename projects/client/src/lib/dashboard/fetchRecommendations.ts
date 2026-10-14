import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { DashboardSettings } from './DashboardSettings.ts';
import type { Recommendation } from './Recommendation.ts';
import { recommendationsSchema } from './recommendationsSchema.ts';
import { toRecommendation } from './toRecommendation.ts';

type FetchRecommendationsParams = {
  fetch: typeof globalThis.fetch;
  /** Null in the browser, where `authenticatedFetch` sends it. */
  token: string | null;
  /** The Type pick and the ignore-library switch. */
  settings: DashboardSettings['recommendations'];
  now?: Date;
};

export type DashboardRecommendations = {
  readonly type: DashboardSettings['recommendations']['type'];
  /** Null when the request failed. */
  readonly items: readonly Recommendation[] | null;
};

/** Enough to still fill the band once anything already watched is filtered out in the browser. */
const LIMIT = 50;

const PATHS = {
  media: '/media/recommendations',
  show: '/shows/recommendations',
  movie: '/movies/recommendations',
} as const;

// Always without what's fully watched, started or already on the watchlist; the library only with the setting.
function query({ ignoreCollected }: DashboardSettings['recommendations']) {
  return new URLSearchParams({
    extended: 'full,images,colors',
    limit: String(LIMIT),
    ignore_watched: 'true',
    hide_watching: 'true',
    ignore_watchlisted: 'true',
    ...(ignoreCollected && { ignore_collected: 'true' }),
  });
}

async function load({ fetch, token, settings, now = new Date() }: FetchRecommendationsParams) {
  const response = await rawApiFetch({ fetch, token, path: `${PATHS[settings.type]}?${query(settings)}` });
  if (!response.ok) return null;

  const parsed = recommendationsSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.flatMap((row) => toRecommendation(row, now) ?? []) : null;
}

/**
 * The viewer's recommendations, as v3 loads them: shows and movies together from `/media/recommendations`, or one
 * type from its own route, each with the sources that led to it. They're calculated daily and leave out what the
 * viewer has watched or started, what's on their watchlist and, with that setting, what's in their library.
 */
export async function fetchRecommendations(params: FetchRecommendationsParams): Promise<DashboardRecommendations> {
  const items = await load(params).catch(() => null);
  return { type: params.settings.type, items };
}
