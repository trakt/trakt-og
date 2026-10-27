import { describe, expect, it } from 'vitest';
import { toCalendarPreferences } from './toCalendarPreferences.ts';

const settings = (calendar: unknown) => ({ browsing: { calendar } });

describe('toCalendarPreferences', () => {
  it('should use defaults for signed-out, missing or invalid settings', () => {
    const defaults = {
      period: 'week',
      layout: 'list',
      startDay: 'today',
      imageType: 'logo',
      hideSpecials: false,
    };
    expect(toCalendarPreferences(null)).toEqual(defaults);
    expect(toCalendarPreferences({})).toEqual(defaults);
    expect(
      toCalendarPreferences(settings({ period: 'year', start_day: 'bogus', layout: 'tiles', image_type: 'x' })),
    ).toEqual(defaults);
  });
  it('should honor every valid setting', () => {
    expect(
      toCalendarPreferences(
        settings({
          period: 'month',
          layout: 'grid',
          start_day: 'monday',
          image_type: 'none',
          hide_specials: true,
        }),
      ),
    ).toEqual({
      period: 'month',
      layout: 'grid',
      startDay: 'monday',
      imageType: 'none',
      hideSpecials: true,
    });
  });
});
