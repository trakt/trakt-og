import { describe, expect, it } from 'vitest';
import { advancedFiltersSearch, emptyFilters } from '../components/filters/advancedFilters.ts';
import { chartHref } from './chartHref.ts';

describe('chartHref', () => {
  it('should carry runtimes and ratings to the chart', () => {
    expect(chartHref('movie', { runtimes: '60-95' })).toBe('/movies/trending?runtimes=60-95');
    expect(chartHref('show', { ratings: '85-100' })).toBe('/shows/trending?ratings=85-100');
  });

  it('should carry every genre, comma-separated like the chart pages', () => {
    expect(chartHref('movie', { genres: 'horror', subgenres: 'halloween,witch' })).toBe(
      '/movies/trending?genres=horror',
    );
    expect(chartHref('movie', { genres: 'drama,history', ratings: '80-100' })).toBe(
      '/movies/trending?genres=drama,history&ratings=80-100',
    );
  });

  it('should keep the excluded genres', () => {
    expect(chartHref('show', { genres: 'comedy,-animation,-anime' })).toBe(
      '/shows/trending?genres=comedy,-animation,-anime',
    );
    expect(chartHref('movie', { genres: '-animation,-family' })).toBe('/movies/trending?genres=-animation,-family');
  });

  it("should match the URL the chart's filter panel writes for the same filters", () => {
    const panel = advancedFiltersSearch({
      ...emptyFilters,
      genres: { values: ['comedy'], mode: 'any', excluded: ['animation', 'anime'] },
      runtimes: [60, 95],
    });
    expect(chartHref('movie', { genres: 'comedy,-animation,-anime', runtimes: '60-95' })).toBe(
      `/movies/trending?${panel}`,
    );
  });

  it('should open the plain chart without filters', () => {
    expect(chartHref('movie', { subgenres: 'christmas' })).toBe('/movies/trending');
  });

  it('should open another chart when named', () => {
    expect(chartHref('show', {}, 'watched/weekly')).toBe('/shows/watched/weekly');
  });
});
