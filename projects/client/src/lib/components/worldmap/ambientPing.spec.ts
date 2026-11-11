import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';
import { describe, expect, it } from 'vitest';
import { ambientPing } from './ambientPing.ts';

const top = { type: 'shows', title: 'Severance', href: '/shows/severance' } as const;
const country = (code: string, share: number, quiet = false): HomeLiveCountry => ({
  code,
  name: code,
  share,
  ...(!quiet && { watching: { shows: 0.6, top } }),
});
const countries = [country('US', 0.6), country('GB', 0.3), country('IS', 0.1, true)];

describe('ambientPing', () => {
  it('should pick countries in proportion to their share', () => {
    expect(ambientPing(countries, () => 0.1)).toBe('US');
    expect(ambientPing(countries, () => 0.7)).toBe('GB');
  });

  it('should never pick a country with only a few people', () => {
    expect(ambientPing(countries, () => 0.999)).toBe('GB');
  });

  it('should pick nothing with nobody on the map', () => {
    expect(ambientPing([country('IS', 0.1, true)], () => 0.5)).toBeNull();
  });
});
