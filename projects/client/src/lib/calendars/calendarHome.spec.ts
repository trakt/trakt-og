import { describe, expect, it } from 'vitest';
import { calendarHome } from './calendarHome.ts';

describe('calendarHome', () => {
  it('should open My Shows & Movies signed in', () => {
    expect(calendarHome(true)).toBe('/calendars/my/shows-movies');
  });

  it('should open All Premieres signed out', () => {
    expect(calendarHome(false)).toBe('/calendars/premieres');
  });
});
