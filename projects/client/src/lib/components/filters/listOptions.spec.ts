import { describe, expect, it } from 'vitest';
import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import { listOptions } from './listOptions.ts';

const config = (type: 'shows' | 'movies', optionTypes?: readonly ('shows' | 'movies')[]) =>
  ({ type, ...(optionTypes && { optionTypes }) }) as AdvancedFiltersConfig;
const labels = (options: readonly { label: string }[]) => options.map(({ label }) => label);

const values = (options: readonly { value: string }[]) => options.map(({ value }) => value);

const movieGenres = [
  'action',
  'adventure',
  'animation',
  'anime',
  'comedy',
  'crime',
  'documentary',
  'donghua',
  'drama',
  'family',
  'fantasy',
  'history',
  'holiday',
  'horror',
  'music',
  'musical',
  'mystery',
  'romance',
  'science-fiction',
  'short',
  'sporting-event',
  'superhero',
  'suspense',
  'thriller',
  'war',
  'western',
];
const showGenres = [
  'action',
  'adventure',
  'animation',
  'anime',
  'biography',
  'children',
  'comedy',
  'crime',
  'documentary',
  'donghua',
  'drama',
  'family',
  'fantasy',
  'game-show',
  'history',
  'holiday',
  'home-and-garden',
  'horror',
  'mini-series',
  'music',
  'musical',
  'mystery',
  'news',
  'reality',
  'romance',
  'science-fiction',
  'short',
  'soap',
  'special-interest',
  'sporting-event',
  'superhero',
  'suspense',
  'talk-show',
  'thriller',
  'war',
  'western',
];

const mixed = config('shows', ['shows', 'movies']);

describe('listOptions', () => {
  describe('for certifications', () => {
    it("should list the movies' US ratings in order", () => {
      expect(labels(listOptions('certifications', config('movies')))).toEqual(['G', 'PG', 'PG-13', 'R', 'Not Rated']);
    });

    it("should list the shows' US ratings in order", () => {
      expect(labels(listOptions('certifications', config('shows')))).toEqual([
        'TV-Y',
        'TV-Y7',
        'TV-G',
        'TV-PG',
        'TV-14',
        'TV-MA',
        'Not Rated',
      ]);
    });

    it('should merge both sets once, by label, on a mixed calendar', () => {
      const options = listOptions('certifications', config('shows', ['shows', 'movies']));
      expect(options.map(({ value }) => value)).toEqual([
        'g',
        'nr',
        'pg',
        'pg-13',
        'r',
        'tv-14',
        'tv-g',
        'tv-ma',
        'tv-pg',
        'tv-y',
        'tv-y7',
      ]);
    });
  });

  describe('for genres', () => {
    it("should list the movies' genres alphabetically", () => {
      expect(values(listOptions('genres', config('movies')))).toEqual(movieGenres);
    });

    it("should list the shows' genres alphabetically", () => {
      expect(values(listOptions('genres', config('shows')))).toEqual(showGenres);
    });

    it("should keep the API's labels", () => {
      const options = listOptions('genres', config('shows'));
      expect(options).toContainEqual({ value: 'science-fiction', label: 'Science Fiction' });
      expect(options).toContainEqual({ value: 'home-and-garden', label: 'Home And Garden' });
    });

    it('should merge both lists once on a mixed calendar', () => {
      expect(values(listOptions('genres', config('shows', ['shows', 'movies'])))).toEqual(showGenres);
    });
  });

  describe('for countries', () => {
    it('should name each country as members see it today', () => {
      const options = listOptions('countries', config('movies'));
      expect(options).toContainEqual({ value: 'us', label: 'United States' });
      expect(options).toContainEqual({ value: 'gb', label: 'United Kingdom' });
      expect(options).toContainEqual({ value: 'tr', label: 'Turkey' });
    });

    it('should list only the countries each media type has titles in', () => {
      const movies = values(listOptions('countries', config('movies')));
      const shows = values(listOptions('countries', config('shows')));
      expect(movies).toHaveLength(232);
      expect(shows).toHaveLength(158);
      expect(movies).toContain('as');
      expect(shows).not.toContain('as');
    });

    it('should keep the alphabetical order', () => {
      expect(values(listOptions('countries', config('shows'))).slice(0, 3)).toEqual(['af', 'al', 'dz']);
    });

    it('should merge both lists once on a mixed calendar', () => {
      expect(listOptions('countries', mixed)).toHaveLength(232);
    });
  });

  describe('for languages', () => {
    it('should list only the languages each media type has titles in', () => {
      const movies = values(listOptions('languages', config('movies')));
      const shows = values(listOptions('languages', config('shows')));
      expect(movies).toHaveLength(170);
      expect(shows).toHaveLength(115);
      expect(shows).toContain('kv');
      expect(movies).not.toContain('kv');
    });

    it('should merge both lists once on a mixed calendar', () => {
      const options = listOptions('languages', mixed);
      expect(options).toHaveLength(172);
      expect(options).toContainEqual({ value: 'ja', label: 'Japanese' });
    });
  });
});
