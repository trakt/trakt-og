import { describe, expect, it } from 'vitest';
import { chartHref } from './chartHref.ts';

describe('chartHref', () => {
  it('should carry runtimes and ratings to the chart', () => {
    expect(chartHref('movie', { runtimes: '60-95' })).toBe('/movies/trending?runtimes=60-95');
    expect(chartHref('show', { ratings: '85-100' })).toBe('/shows/trending?ratings=85-100');
  });

  it('should carry the included genres', () => {
    expect(chartHref('movie', { genres: 'horror', subgenres: 'halloween,witch' })).toBe(
      '/movies/trending?genres=horror',
    );
    expect(chartHref('movie', { genres: 'drama,history', ratings: '80-100' })).toBe(
      '/movies/trending?genres=drama%2Chistory&ratings=80-100',
    );
  });

  it('should drop the excluded genres, and open the plain chart when nothing is left', () => {
    expect(chartHref('show', { genres: 'comedy,-animation,-anime' })).toBe('/shows/trending?genres=comedy');
    expect(chartHref('movie', { genres: '-animation,-family' })).toBe('/movies/trending');
    expect(chartHref('movie', { subgenres: 'christmas' })).toBe('/movies/trending');
  });

  it('should open another chart when named', () => {
    expect(chartHref('show', {}, 'watched/weekly')).toBe('/shows/watched/weekly');
  });
});
