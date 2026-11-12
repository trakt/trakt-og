import { type Promotion, promotionSchema } from './Promotion.ts';

/** The promotions in a `GET /vip/promotions` payload. Anything that isn't an array is none, and an entry that doesn't fit is skipped. */
export function parsePromotions(payload: unknown): Promotion[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((entry) => {
    const parsed = promotionSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}
