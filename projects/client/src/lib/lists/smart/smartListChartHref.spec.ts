import { describe, expect, it } from 'vitest';
import { smartListChartHref } from './smartListChartHref.ts';

const now = new Date('2026-11-02T12:00:00Z');
const list = {
  slug: 'hbo-dramas-1a2b',
  source: 'trending' as const,
  mediaType: 'shows' as const,
  filters: { genres: ['drama', '-animation'], networks: ['HBO'], ratings: [75, 100] },
};

describe('util: smartListChartHref', () => {
  it("should open the source's chart with the filters and the list's slug", () => {
    expect(smartListChartHref({ list, now })).toBe(
      '/shows/trending?genres=drama,-animation&networks=HBO&ratings=75-100&smart=hbo-dramas-1a2b',
    );
  });

  it("should open recommendations with the other charts' filters", () => {
    expect(smartListChartHref({ list: { ...list, source: 'recommendations' }, now })).toBe(
      '/shows/recommendations?genres=drama,-animation&networks=HBO&ratings=75-100&smart=hbo-dramas-1a2b',
    );
  });

  it('should open an unfiltered list on the bare chart', () => {
    expect(smartListChartHref({ list: { ...list, filters: {} }, now })).toBe('/shows/trending?smart=hbo-dramas-1a2b');
  });

  it.each([
    ['a source with no chart', { source: 'watchlist' as const }],
    ['both media types', { mediaType: 'media' as const }],
    ['a filter only the list page can show', { filters: { keywords: ['heist'] } }],
    ['a filter this chart has no control for', { mediaType: 'movies' as const, filters: { networks: ['HBO'] } }],
  ])('should give null for %s', (_, change) => {
    expect(smartListChartHref({ list: { ...list, ...change }, now })).toBeNull();
  });
});
