import { describe, expect, it } from 'vitest';
import { scheduleCalendars } from './scheduleCalendars.ts';

describe('scheduleCalendars', () => {
  it('should read Shows & Movies for all of both', () => {
    expect(scheduleCalendars({ filter: 'shows-movies', movies: 'all' })).toEqual(['shows-movies']);
    expect(scheduleCalendars({ filter: 'shows', movies: 'all' })).toEqual(['shows-movies']);
  });

  it('should read the shows alone without movies', () => {
    expect(scheduleCalendars({ filter: 'shows-movies', movies: 'none' })).toEqual(['shows']);
    expect(scheduleCalendars({ filter: 'finales', movies: 'none' })).toEqual(['finales']);
  });

  it('should put the movies beside a narrower shows pick', () => {
    expect(scheduleCalendars({ filter: 'premieres', movies: 'all' })).toEqual(['premieres', 'movies']);
  });

  it('should read the movies alone without shows', () => {
    expect(scheduleCalendars({ filter: 'none', movies: 'all' })).toEqual(['movies']);
  });

  it('should read nothing with neither', () => {
    expect(scheduleCalendars({ filter: 'none', movies: 'none' })).toEqual([]);
  });
});
