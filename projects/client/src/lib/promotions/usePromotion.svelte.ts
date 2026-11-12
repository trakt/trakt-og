import { activePromotion } from './activePromotion.ts';
import { nextPromotionChange } from './nextPromotionChange.ts';
import type { Promotion } from './Promotion.ts';

/** The promotion running now. A cached list can't keep an offer alive or start it early, so it re-checks at each start and end. */
export function usePromotion(promotions: () => readonly Promotion[]) {
  let now = $state(Date.now());

  $effect(() => {
    const change = nextPromotionChange(promotions(), now);
    if (!change) return;
    const timer = setTimeout(() => (now = Date.now()), Math.min(change - Date.now(), 2 ** 31 - 1));
    return () => clearTimeout(timer);
  });

  return {
    get current() {
      return activePromotion(promotions(), now);
    },
  };
}
