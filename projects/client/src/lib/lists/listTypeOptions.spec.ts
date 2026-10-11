import { describe, expect, it } from 'vitest';
import { listTypeOptions } from './listTypeOptions.ts';

const labels = (kind: Parameters<typeof listTypeOptions>[0]) => listTypeOptions(kind).map(({ label }) => label);

describe('util: listTypeOptions', () => {
  it('should never offer People, since lists take no people', () => {
    for (const kind of ['personal', 'official', 'watchlist'] as const) {
      expect(labels(kind)).toEqual(['Movies', 'Shows', 'Seasons', 'Episodes']);
    }
  });

  it('should offer only movies and shows on favorites', () => {
    expect(labels('favorites')).toEqual(['Movies', 'Shows']);
  });
});
