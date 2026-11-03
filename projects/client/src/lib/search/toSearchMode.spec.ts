import { describe, expect, it } from 'vitest';
import { searchTypes } from '../components/header/searchTypes.ts';
import type { SearchType } from './SearchType.ts';
import { toSearchMode } from './toSearchMode.ts';

const modes = (slugs: ReadonlyArray<SearchType['slug']>) => slugs.map(toSearchMode);

describe('toSearchMode', () => {
  it("should map each text search tab to trakt-web's mode", () => {
    expect(modes(['', 'shows', 'movies', 'people', 'lists'])).toEqual(['media', 'show', 'movie', 'people', 'lists']);
  });

  it('should count an ID lookup as the mixed search', () => {
    expect(modes(['trakt', 'imdb', 'tmdb', 'tvdb'])).toEqual(['media', 'media', 'media', 'media']);
  });

  it('should give every search tab a mode', () => {
    expect(modes(searchTypes.map(({ slug }) => slug)).every(Boolean)).toBe(true);
  });
});
