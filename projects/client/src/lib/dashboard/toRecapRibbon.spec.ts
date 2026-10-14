import { describe, expect, it } from 'vitest';
import { toRecapRibbon } from './toRecapRibbon.ts';

const plays = [1900, 1400, 2200, 1700, 1500, 2000, 2600, 2300, 1834, 312];

describe('toRecapRibbon', () => {
  const ribbon = toRecapRibbon({ today: '2026-10-13', plays, slug: 'justin' });

  it('should total the year and open its Year in Review', () => {
    expect(ribbon).toMatchObject({
      year: 2026,
      title: 'Year to Date',
      plays: 17_746,
      href: 'https://app.trakt.tv/users/justin/year/2026',
    });
  });

  it("should give all twelve months in Discover's month colors", () => {
    expect(ribbon.months.map(({ month, theme }) => `${month} ${theme}`)).toEqual([
      'Jan snowed-in',
      'Feb love-month',
      'Mar game-on',
      'Apr mind-benders',
      'May space-month',
      'Jun pride',
      'Jul summer-trip',
      'Aug back-to-school',
      'Sep case-files',
      'Oct halloween',
      'Nov comfort-food',
      'Dec holidays',
    ]);
  });

  describe('for months gone by', () => {
    it('should show the plays and open the Month in Review', () => {
      expect(ribbon.months.at(0)).toMatchObject({
        state: 'past',
        progress: 1,
        plays: 1900,
        caption: '1.9k plays',
        tag: null,
        label: 'January 2026: 1,900 plays',
        href: 'https://app.trakt.tv/users/justin/mir/2026/1',
      });
    });

    it('should keep the plays and tag the latest finished month as the Month in Review', () => {
      expect(ribbon.months.at(8)).toMatchObject({
        state: 'past',
        caption: '1.8k plays',
        tag: { kind: 'review' },
        label: 'September 2026: 1,834 plays, Month in Review',
        href: 'https://app.trakt.tv/users/justin/mir/2026/9',
      });
    });

    it('should size each bar against the busiest month', () => {
      expect(ribbon.months.at(6)?.share).toBe(1);
      expect(ribbon.months.at(1)?.share).toBeCloseTo(1400 / 2600);
    });
  });

  describe('for this month', () => {
    it('should keep the plays, tag the days left and open the history', () => {
      expect(ribbon.months.at(9)).toMatchObject({
        state: 'current',
        progress: 13 / 31,
        caption: '312 plays',
        tag: { kind: 'left', days: 19 },
        label: 'October 2026 so far: 312 plays, 19 days left',
        href: '/users/justin/history',
      });
    });
  });

  describe('for months to come', () => {
    it('should leave them empty and unlinked', () => {
      expect(ribbon.months.at(10)).toMatchObject({
        state: 'future',
        plays: null,
        share: 0,
        caption: '',
        tag: null,
        label: 'November 2026',
        href: null,
      });
    });
  });

  describe('in January', () => {
    const lastYear = [1900, 1400, 2200, 1700, 1500, 2000, 2600, 2300, 1834, 1200, 1500, 2100];
    const january = toRecapRibbon({ today: '2027-01-05', plays: lastYear, slug: 'justin' });

    it('should show last year under its Year in Review', () => {
      expect(january).toMatchObject({
        year: 2026,
        title: 'Year in Review',
        plays: 22_234,
        href: 'https://app.trakt.tv/users/justin/year/2026',
      });
    });

    it('should show every month as gone by, with its Month in Review', () => {
      expect(january.months.every(({ state, progress }) => state === 'past' && progress === 1)).toBe(true);
      expect(january.months.at(0)?.href).toBe('https://app.trakt.tv/users/justin/mir/2026/1');
    });

    it('should tag December as the latest Month in Review', () => {
      expect(january.months.at(11)).toMatchObject({
        caption: '2.1k plays',
        tag: { kind: 'review' },
        label: 'December 2026: 2,100 plays, Month in Review',
        href: 'https://app.trakt.tv/users/justin/mir/2026/12',
      });
      expect(january.months.filter(({ tag }) => tag).length).toBe(1);
    });

    it('should go back to this year in February', () => {
      const february = toRecapRibbon({ today: '2027-02-01', plays: [1200, 40], slug: 'justin' });
      expect(february).toMatchObject({ year: 2027, title: 'Year to Date' });
      expect(february.months.at(0)?.tag).toEqual({ kind: 'review' });
      expect(february.months.at(1)?.state).toBe('current');
    });
  });

  it('should read "Year in Review" from December 18th', () => {
    const december = toRecapRibbon({ today: '2026-12-18', plays: Array(12).fill(1), slug: 'justin' });
    expect(december.title).toBe('Year in Review');
  });

  it('should say "1 play" for a single play', () => {
    const quiet = toRecapRibbon({ today: '2026-03-02', plays: [1, 0, 0], slug: 'justin' });
    expect(quiet.months.at(0)?.caption).toBe('1 play');
    expect(quiet.months.at(1)?.share).toBe(0);
  });

  it('should leave every bar empty when nothing was watched', () => {
    const empty = toRecapRibbon({ today: '2026-03-02', plays: [0, 0, 0], slug: 'justin' });
    expect(empty.months.every(({ share }) => share === 0)).toBe(true);
  });
});
