import { describe, expect, it } from 'vitest';
import { DISCOVER_THEMES } from './discoverThemes.ts';
import { seasonRibbon } from './seasonRibbon.ts';

describe('seasonRibbon', () => {
  it('should give each month its theme and how far through it today is', () => {
    const ribbon = seasonRibbon(DISCOVER_THEMES, '2026-10-07');

    expect(ribbon).toHaveLength(12);
    expect(ribbon.at(0)).toEqual({ id: 'snowed-in', month: 'Jan', title: 'Snowed In', progress: 1 });
    expect(ribbon.at(9)).toEqual({
      id: 'halloween',
      month: 'Oct',
      title: '31 Nights of Horror',
      progress: 7 / 31,
      daysLeft: 25,
    });
    expect(ribbon.at(10)).toMatchObject({ month: 'Nov', progress: 0 });
    expect(ribbon.filter(({ daysLeft }) => daysLeft !== undefined)).toHaveLength(1);
  });

  it("should count a leap February's days", () => {
    expect(seasonRibbon(DISCOVER_THEMES, '2028-02-29').at(1)).toMatchObject({ progress: 1, daysLeft: 1 });
  });
});
