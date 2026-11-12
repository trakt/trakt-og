import { describe, expect, it } from 'vitest';
import { offerLines } from './promotionCopy.ts';
import type { Promotion } from './Promotion.ts';

const offer = {
  plan: { duration: 'two_years', currency: 'usd', amount: 100, discounted_amount: 70, months_in_term: 24 },
} as Promotion;

describe('util: promotionCopy', () => {
  it('should name the plan length and the offer price', () => {
    expect(offerLines(offer)).toEqual({ term: '2 years', price: '$70' });
  });

  it('should fall back to months for an unnamed duration', () => {
    expect(offerLines({ plan: { ...offer.plan, duration: 'six_months', months_in_term: 6 } }).term).toBe('6 months');
  });
});
