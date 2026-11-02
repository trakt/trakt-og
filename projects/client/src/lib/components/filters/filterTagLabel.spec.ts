import { describe, expect, it } from 'vitest';
import { filterTagLabel } from './filterTagLabel.ts';

describe('filterTagLabel', () => {
  it('should name the filter behind each kind of chip', () => {
    expect(filterTagLabel('genres')).toBe('Genres');
    expect(filterTagLabel('episode_types')).toBe('Episodes');
    expect(filterTagLabel('watchnow')).toBe('Streaming');
    expect(filterTagLabel('runtimes')).toBe('Runtime');
    expect(filterTagLabel('query')).toBe('Title');
    expect(filterTagLabel('letterboxd_ratings')).toBe('Letterboxd');
    expect(filterTagLabel('parental')).toBe('Parental Guide');
    expect(filterTagLabel('bogus')).toBe('');
  });
});
