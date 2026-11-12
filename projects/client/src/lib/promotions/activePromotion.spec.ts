import { describe, expect, it } from 'vitest';
import { activePromotion } from './activePromotion.ts';
import type { Promotion } from './Promotion.ts';

const offer = (overrides: Partial<Promotion> = {}): Promotion => ({
  id: 'spring-offer',
  name: 'Spring Offer',
  label: 'SO · 01',
  theme: 'tickets',
  starts_at: '2030-03-01T08:00:00.000Z',
  ends_at: '2030-03-06T08:00:00.000Z',
  plan: {
    duration: 'two_years',
    currency: 'usd',
    amount: 100,
    discounted_amount: 70,
    months_in_term: 24,
    first_term_only: true,
  },
  ...overrides,
});

const pick = (promotions: Promotion[], at: string) => activePromotion(promotions, Date.parse(at))?.id ?? null;

describe('util: activePromotion', () => {
  it('should be none before the start', () => {
    expect(pick([offer()], '2030-03-01T07:59:59.999Z')).toBeNull();
  });

  it('should include the start instant', () => {
    expect(pick([offer()], '2030-03-01T08:00:00.000Z')).toBe('spring-offer');
  });

  it('should exclude the end instant', () => {
    expect(pick([offer()], '2030-03-06T07:59:59.999Z')).toBe('spring-offer');
    expect(pick([offer()], '2030-03-06T08:00:00.000Z')).toBeNull();
  });

  it('should ignore themes the site does not draw', () => {
    expect(pick([offer({ theme: 'unknown' })], '2030-03-02T00:00:00.000Z')).toBeNull();
  });

  it('should skip an upcoming offer for the running one', () => {
    const later = offer({ id: 'later', starts_at: '2030-04-01T00:00:00.000Z', ends_at: '2030-04-02T00:00:00.000Z' });
    expect(pick([later, offer()], '2030-03-02T00:00:00.000Z')).toBe('spring-offer');
  });
});
