import type { Promotion } from '#lib/promotions/Promotion.ts';

export const demoPromotion: Promotion = {
  id: 'spring-offer',
  name: 'Spring Offer',
  label: 'SO · 01',
  theme: 'tickets',
  starts_at: '2000-01-01T00:00:00.000Z',
  ends_at: '2999-01-01T00:00:00.000Z',
  plan: {
    duration: 'two_years',
    currency: 'usd',
    amount: 100,
    discounted_amount: 70,
    months_in_term: 24,
    first_term_only: true,
  },
};
