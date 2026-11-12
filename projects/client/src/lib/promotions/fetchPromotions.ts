import { rawApiFetch } from '../api/rawApiFetch.ts';
import { parsePromotions } from './parsePromotions.ts';
import type { Promotion } from './Promotion.ts';

/** `GET /vip/promotions`, which `@trakt/api` has no contract for. A failed or odd answer is no promotions. */
export async function fetchPromotions(fetch: typeof globalThis.fetch): Promise<Promotion[]> {
  try {
    const response = await rawApiFetch({ fetch, path: '/vip/promotions' });
    return response.ok ? parsePromotions(await response.json()) : [];
  } catch {
    return [];
  }
}
