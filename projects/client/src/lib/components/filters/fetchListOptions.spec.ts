import { describe, expect, it, vi } from 'vitest';
import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import { fetchFilterBody } from './fetchFilterBody.ts';
import { fetchListOptions } from './fetchListOptions.ts';

vi.mock('./fetchFilterBody.ts', () => ({ fetchFilterBody: vi.fn() }));

const config = (type: 'shows' | 'movies', optionTypes?: readonly ('shows' | 'movies')[]) =>
  ({ type, ...(optionTypes && { optionTypes }) }) as AdvancedFiltersConfig;
const labels = (options: readonly { label: string }[]) => options.map(({ label }) => label);

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
});
