import { describe, expect, it } from 'vitest';
import { featuredLists } from './featuredLists.ts';

describe('featuredLists', () => {
  it('should keep the eight essentials in order', () => {
    expect(featuredLists.map(({ id }) => id)).toEqual([
      2_142_753,
      2_143_363,
      1_248_149,
      2_233_867,
      832_943,
      5_790_552,
      1_257_909,
      1_402_475,
    ]);
  });

  it('should find the art for every tile', () => {
    for (const list of featuredLists) {
      expect(list.background, list.title.join(' ')).toMatch(/bg\.jpg$/);
      expect(list.logo, list.title.join(' ')).toMatch(/logo\.png$/);
    }
  });

  it('should label only the two IMDB tiles', () => {
    expect(featuredLists.filter((list) => list.label).map(({ title, label }) => [title[1], label])).toEqual([
      ['Top 250 Movies', 'Updated Daily'],
      ['Top 250 TV Shows', 'Updated Daily'],
    ]);
  });

  it('should keep only the square logos upright', () => {
    expect(featuredLists.filter((list) => list.upright).map(({ title }) => title[0])).toEqual(['Academy Awards', 'DC']);
  });
});
