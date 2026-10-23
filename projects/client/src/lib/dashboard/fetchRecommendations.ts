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
  /** No recommendations yet, so these are trending titles. */
  readonly fallback?: boolean;
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

const TRENDING = {
  media: ['/shows/trending', '/movies/trending'],
  show: ['/shows/trending'],
  movie: ['/movies/trending'],
} as const;

// A new account gets no recommendations until it has history, so the panel deals trending titles meanwhile, shows
// and movies alternately. Trending rows are recommendation rows without the sources.
async function loadTrending({ fetch, settings, now = new Date() }: FetchRecommendationsParams) {
  const search = new URLSearchParams({ extended: 'full,images,colors', limit: String(LIMIT) });
  const lists = await Promise.all(
    TRENDING[settings.type].map(async (path) => {
      const response = await rawApiFetch({ fetch, path: `${path}?${search}` });
      if (!response.ok) return [];
      const parsed = recommendationsSchema.safeParse(await response.json());
      return parsed.success ? parsed.data.flatMap((row) => toRecommendation(row, now) ?? []) : [];
    }),
  );
  const longest = Math.max(...lists.map((list) => list.length));
  return Array.from({ length: longest }, (_, i) => lists.map((list) => list[i])).flat()
    .filter((item): item is Recommendation => item !== undefined);
}

/**
 * The viewer's recommendations, as v3 loads them: shows and movies together from `/media/recommendations`, or one
 * type from its own route, each with the sources that led to it. They're calculated daily and leave out what the
 * viewer has watched or started, what's on their watchlist and, with that setting, what's in their library.
 */
export async function fetchRecommendations(params: FetchRecommendationsParams): Promise<DashboardRecommendations> {
  const items = await load(params).catch(() => null);
  if (items?.length === 0) {
    const trending = await loadTrending(params).catch(() => []);
    if (trending.length > 0) return { type: params.settings.type, items: trending, fallback: true };
  }
  return { type: params.settings.type, items };
}
