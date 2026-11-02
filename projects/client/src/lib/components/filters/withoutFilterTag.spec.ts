import { describe, expect, it } from 'vitest';
import { emptyFilters } from './advancedFilters.ts';
import { filterTags } from './filterTags.ts';
import { withoutFilterTag } from './withoutFilterTag.ts';

const filters = {
  ...emptyFilters,
  query: 'shogun',
  watchnow: ['netflix', 'hulu'],
  genres: { values: ['drama'], mode: 'any' as const, excluded: ['crime'] },
  certifications: { values: ['tv-ma'], mode: 'none' as const },
  runtimes: [20, 90] as const,
  parental: { nudity: 0, violence: 2 } as const,
};

describe('withoutFilterTag', () => {
  it('should drop each tag the sidebar shows, and only that one', () => {
    for (const tag of filterTags(filters)) {
      const ids = filterTags(withoutFilterTag(filters, tag.id)).map(({ id }) => id);
      expect(ids).toEqual(filterTags(filters).flatMap(({ id }) => (id === tag.id ? [] : [id])));
    }
  });

  it('should clear a whole filter', () => {
    expect(withoutFilterTag(filters, 'genres').genres).toEqual(emptyFilters.genres);
    expect(withoutFilterTag(filters, 'watchnow').watchnow).toEqual([]);
    expect(withoutFilterTag(filters, 'query').query).toBe('');
    expect(withoutFilterTag(filters, 'runtimes').runtimes).toBeNull();
    expect(withoutFilterTag(filters, 'parental').parental).toEqual({});
  });

  it('should leave the filters alone for an unknown tag', () => {
    expect(withoutFilterTag(filters, 'bogus')).toBe(filters);
  });
});
