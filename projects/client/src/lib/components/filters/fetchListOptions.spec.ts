import { describe, expect, it, vi } from 'vitest';
import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import { fetchFilterBody } from './fetchFilterBody.ts';
import { fetchListOptions } from './fetchListOptions.ts';

vi.mock('./fetchFilterBody.ts', () => ({ fetchFilterBody: vi.fn() }));

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

describe('fetchListOptions', () => {
  describe('for certifications', () => {
    it("should list the movies' US ratings in order", async () => {
      expect(labels(await fetchListOptions('certifications', config('movies')))).toEqual([
        'G',
        'PG',
        'PG-13',
        'R',
        'Not Rated',
      ]);
    });

    it("should list the shows' US ratings in order", async () => {
      expect(labels(await fetchListOptions('certifications', config('shows')))).toEqual([
        'TV-Y',
        'TV-Y7',
        'TV-G',
        'TV-PG',
        'TV-14',
        'TV-MA',
        'Not Rated',
      ]);
    });

    it('should merge both sets once, by label, on a mixed calendar', async () => {
      const options = await fetchListOptions('certifications', config('shows', ['shows', 'movies']));
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

    it('should not ask the API', async () => {
      await fetchListOptions('certifications', config('shows', ['shows', 'movies']));
      expect(fetchFilterBody).not.toHaveBeenCalled();
    });
  });

  describe('for genres', () => {
    it("should list the movies' genres alphabetically", async () => {
      expect(values(await fetchListOptions('genres', config('movies')))).toEqual(movieGenres);
    });

    it("should list the shows' genres alphabetically", async () => {
      expect(values(await fetchListOptions('genres', config('shows')))).toEqual(showGenres);
    });

    it("should keep the API's labels", async () => {
      const options = await fetchListOptions('genres', config('shows'));
      expect(options).toContainEqual({ value: 'science-fiction', label: 'Science Fiction' });
      expect(options).toContainEqual({ value: 'home-and-garden', label: 'Home And Garden' });
    });

    it('should merge both lists once on a mixed calendar', async () => {
      expect(values(await fetchListOptions('genres', config('shows', ['shows', 'movies'])))).toEqual(showGenres);
    });

    it('should not ask the API', async () => {
      await fetchListOptions('genres', config('shows', ['shows', 'movies']));
      expect(fetchFilterBody).not.toHaveBeenCalled();
    });
  });
});
