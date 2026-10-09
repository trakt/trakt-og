import { describe, expect, it } from 'vitest';
import { filterTagLabel } from './filterTagLabel.ts';

describe('filterTagLabel', () => {
  it('should name the filter behind each kind of chip', () => {
    expect(filterTagLabel('genres-drama')).toBe('Genres');
    expect(filterTagLabel('genres--crime')).toBe('Genres');
    expect(filterTagLabel('episode_types-season_finale')).toBe('Episodes');
    expect(filterTagLabel('watchnow-netflix')).toBe('Streaming');
    expect(filterTagLabel('runtimes')).toBe('Runtime');
    expect(filterTagLabel('query')).toBe('Title');
    expect(filterTagLabel('bogus')).toBe('');
  });
});
