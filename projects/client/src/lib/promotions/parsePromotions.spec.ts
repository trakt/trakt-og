import { describe, expect, it } from 'vitest';
import { parsePromotions } from './parsePromotions.ts';

const entry = {
  id: 'spring-offer',
  name: 'Spring Offer',
  label: 'SO · 01',
  theme: 'tickets',
  starts_at: '2030-03-01T08:00:00.000Z',
  ends_at: '2030-03-06T08:00:00.000Z',
  audience: 'not_renewing',
  plan: {
    duration: 'two_years',
    currency: 'usd',
    amount: 100,
    amount_off: 40,
    discounted_amount: 70,
    months_in_term: 24,
    first_term_only: true,
  },
  app_countries: ['us'],
};

describe('util: parsePromotions', () => {
  it('should read a promotion and drop the fields the site does not use', () => {
    const [promotion] = parsePromotions([entry]);
    expect(promotion?.id).toBe('spring-offer');
    expect(promotion?.plan.discounted_amount).toBe(70);
    expect(promotion).not.toHaveProperty('app_countries');
  });

  it('should be none for an empty list', () => {
    expect(parsePromotions([])).toEqual([]);
  });

  it('should be none when the payload is not a list', () => {
    expect(parsePromotions({ error: 'nope' })).toEqual([]);
    expect(parsePromotions(null)).toEqual([]);
  });

  it('should skip an entry that does not fit and keep the rest', () => {
    const broken = { ...entry, id: 'broken', starts_at: 'soon' };
    expect(parsePromotions([broken, entry]).map(({ id }) => id)).toEqual(['spring-offer']);
  });
});
