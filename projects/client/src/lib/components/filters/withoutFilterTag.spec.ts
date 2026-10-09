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
};

describe('withoutFilterTag', () => {
  it('should drop each tag the sidebar shows', () => {
    for (const tag of filterTags(filters)) {
      expect(filterTags(withoutFilterTag(filters, tag.id)).map(({ id }) => id)).not.toContain(tag.id);
    }
  });

  it('should keep the rest of a mixed list', () => {
    expect(withoutFilterTag(filters, 'genres--crime').genres).toEqual({ values: ['drama'], mode: 'any' });
    expect(withoutFilterTag(filters, 'genres-drama').genres).toEqual({ values: ['crime'], mode: 'none' });
    expect(withoutFilterTag(filters, 'certifications-tv-ma').certifications).toEqual({ values: [], mode: 'any' });
  });

  it('should drop a service, the terms and a range', () => {
    expect(withoutFilterTag(filters, 'watchnow-netflix').watchnow).toEqual(['hulu']);
    expect(withoutFilterTag(filters, 'query').query).toBe('');
    expect(withoutFilterTag(filters, 'runtimes').runtimes).toBeNull();
  });
});
