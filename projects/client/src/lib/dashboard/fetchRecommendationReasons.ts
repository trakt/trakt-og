import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { Recommendation } from './Recommendation.ts';
import { recommendationReasonsSchema } from './recommendationReasonsSchema.ts';
import { toRecommendationWhy } from './toRecommendationWhy.ts';

type FetchRecommendationReasonsParams = {
  fetch: typeof globalThis.fetch;
  type: Recommendation['type'];
  id: number;
};

/**
 * Why one Smart pick was made, loaded when its "Why this?" opens: the list leaves reasons out to stay fast. VIPs get
 * the titles, people and subgenres behind it, everyone else none. Null when the request fails.
 */
export async function fetchRecommendationReasons({
  fetch,
  type,
  id,
}: FetchRecommendationReasonsParams): Promise<Recommendation['why'] | null> {
  const response = await rawApiFetch({ fetch, path: `/v3/recommendations/${type}/${id}/reasons` });
  if (!response.ok) return null;

  const parsed = recommendationReasonsSchema.safeParse(await response.json());
  return parsed.success ? toRecommendationWhy(parsed.data) : null;
}
