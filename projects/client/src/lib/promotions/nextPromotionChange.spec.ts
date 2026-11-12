import { describe, expect, it } from 'vitest';
import { nextPromotionChange } from './nextPromotionChange.ts';
import type { Promotion } from './Promotion.ts';

const offer = (starts_at: string, ends_at: string) => ({ id: 'spring-offer', starts_at, ends_at }) as Promotion;

describe('util: nextPromotionChange', () => {
  const promotions = [offer('2030-03-01T08:00:00.000Z', '2030-03-06T08:00:00.000Z')];

  it('should be the start while the offer is upcoming', () => {
    expect(nextPromotionChange(promotions, Date.parse('2030-02-20T00:00:00Z'))).toBe(
      Date.parse('2030-03-01T08:00:00.000Z'),
    );
  });

  it('should be the end while it runs', () => {
    expect(nextPromotionChange(promotions, Date.parse('2030-03-02T00:00:00Z'))).toBe(
      Date.parse('2030-03-06T08:00:00.000Z'),
    );
  });

  it('should be none once everything is over', () => {
    expect(nextPromotionChange(promotions, Date.parse('2030-03-06T08:00:00Z'))).toBeNull();
  });
});
