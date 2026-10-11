import { describe, expect, it } from 'vitest';
import { recentSearchType } from './recentSearchType.ts';

describe('util: recentSearchType', () => {
  it("should read API's spellings for Shows & Movies and official lists", () => {
    expect(recentSearchType('all').label).toBe('Shows & Movies');
    expect(recentSearchType('official_lists').label).toBe('Lists');
  });

  it('should keep a known type and fall back to Shows & Movies', () => {
    expect(recentSearchType('people').slug).toBe('people');
    expect(recentSearchType('imdb').label).toBe('IMDB ID');
    expect(recentSearchType(null).slug).toBe('');
    expect(recentSearchType('nope').slug).toBe('');
  });
});
