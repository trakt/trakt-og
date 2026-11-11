import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';
import { describe, expect, it } from 'vitest';
import { pingsFor } from './pingsFor.ts';

const top = { type: 'shows', title: 'Severance', href: '/shows/severance' } as const;
const country = (code: string, share: number, quiet = false): HomeLiveCountry => ({
  code,
  name: code,
  share,
  ...(!quiet && { watching: { shows: 0.6, top } }),
});
const random = () => 0.5;

describe('pingsFor', () => {
  it('should ping a country once per tenth of a point it gained, up to four', () => {
    const pings = pingsFor({
      before: [country('US', 0.34), country('GB', 0.067), country('PT', 0.021)],
      after: [country('US', 0.343), country('GB', 0.068), country('PT', 0.028)],
      random,
    });

    expect(pings.filter(({ code }) => code === 'US')).toHaveLength(3);
    expect(pings.filter(({ code }) => code === 'GB')).toHaveLength(1);
    expect(pings.filter(({ code }) => code === 'PT')).toHaveLength(4);
  });

  it('should ping a big country as often as a small one for the same gain', () => {
    const pings = pingsFor({
      before: [country('US', 0.34), country('PT', 0.021)],
      after: [country('US', 0.342), country('PT', 0.023)],
      random,
    });

    expect(pings.filter(({ code }) => code === 'US')).toHaveLength(2);
    expect(pings.filter(({ code }) => code === 'PT')).toHaveLength(2);
  });

  it('should leave a country alone when its share held or fell', () => {
    expect(pingsFor({ before: [country('US', 0.3)], after: [country('US', 0.29)], random })).toEqual([]);
  });

  it('should give a country new to the map two big pings', () => {
    expect(pingsFor({ before: [], after: [country('BR', 0.02)], random })).toEqual([
      { code: 'BR', delay: 0.5, big: true },
      { code: 'BR', delay: 0.5, big: true },
    ]);
  });

  it('should never ping a country with only a few people', () => {
    expect(pingsFor({ before: [country('IS', 0.001, true)], after: [country('IS', 0.004, true)], random })).toEqual([]);
  });
});
