import { describe, expect, it } from 'vitest';
import { filterReleaseCountries } from './filterReleaseCountries.ts';

const columns = [{ id: 'theatrical' }, { id: 'physical' }];
const countries = [
  { code: 'tr', cells: [['jul'], []] },
  { code: 'gb', cells: [['jul'], ['dec']] },
  { code: 'us', cells: [[], ['dec']] },
];
const codes = (country: string, column = 'all') =>
  filterReleaseCountries({ countries, columns, country, column }).map(({ code }) => code);

describe('filterReleaseCountries', () => {
  it('should keep every country, or only the picked one', () => {
    expect(codes('all')).toEqual(['tr', 'gb', 'us']);
    expect(codes('gb')).toEqual(['gb']);
  });

  it('should keep only countries with a date in the picked column', () => {
    expect(codes('all', 'physical')).toEqual(['gb', 'us']);
    expect(codes('gb', 'theatrical')).toEqual(['gb']);
    expect(codes('us', 'theatrical')).toEqual([]);
  });
});
