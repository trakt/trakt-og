import { describe, expect, it } from 'vitest';
import { toMovieReleases } from './toMovieReleases.ts';

const datePreferences = { order: 'dmy', timeZone: 'America/Los_Angeles', hour24: false, weekStartDay: 1 } as const;
const row = (country: string, release_date: string, release_type = 'theatrical') => ({
  country,
  release_date,
  release_type,
});
const map = (releases: Parameters<typeof toMovieReleases>[0]['releases'], extra = {}) =>
  toMovieReleases({ releases, originalCountry: 'us', today: '1999-10-20', datePreferences, ...extra });

describe('toMovieReleases', () => {
  it('should group and sort countries by name, then dates chronologically without mutating the input', () => {
    const releases = Object.freeze([row('us', '1999-11-01'), row('gb', '1999-11-06'), row('US', '1999-10-15')]);
    const { countries } = map(releases);
    expect(countries.map(({ name, original }) => [name, original])).toEqual([
      ['United Kingdom', false],
      ['United States', true],
    ]);
    expect(countries.at(1)?.dates.map(({ dateText }) => dateText)).toEqual(['15 Oct 1999', '1 Nov 1999']);
    expect(releases.at(0)?.release_date).toBe('1999-11-01');
  });

  it('should keep only the columns the movie has, with limited runs under Theatrical and counts per column', () => {
    const { columns, countries } = map([
      row('us', '1999-10-15', 'limited'),
      row('us', '1999-10-22'),
      row('us', '2000-04-18', 'physical'),
      row('gb', '1999-11-12'),
      row('gb', '2000-05-01', 'streaming'),
    ]);
    expect(columns).toEqual([
      { id: 'theatrical', label: 'Theatrical', count: 2 },
      { id: 'physical', label: 'Physical', count: 1 },
      { id: 'unknown', label: 'Unknown', count: 1 },
    ]);
    const us = countries.find(({ code }) => code === 'us');
    expect(us?.cells.map((dates) => dates.map(({ date, limited }) => [date, limited]))).toEqual([
      [
        ['1999-10-15', true],
        ['1999-10-22', false],
      ],
      [['2000-04-18', false]],
      [],
    ]);
  });

  it('should preserve calendar dates west of UTC and label every release type', () => {
    const releases = ['premiere', 'limited', 'theatrical', 'digital', 'physical', 'tv', 'unknown'].map((type) =>
      row('us', '1999-10-15T00:00:00.000Z', type),
    );
    const dates = map(releases).countries.at(0)?.dates;
    expect(dates?.map(({ type }) => type)).toEqual([
      'Premiere',
      'Theatrical',
      'Theatrical',
      'Digital',
      'Physical',
      'TV',
      'Unknown',
    ]);
    expect(dates?.every(({ dateText }) => dateText === '15 Oct 1999')).toBe(true);
  });

  it("should take the theatrical certification as the country's and repeat only the ones that differ", () => {
    const { countries } = map([
      { ...row('gb', '1999-11-01', 'premiere'), certification: '15' },
      { ...row('gb', '1999-11-12'), certification: '18' },
      { ...row('gb', '2000-05-01', 'digital'), certification: '18', note: '<b>Festival</b>' },
    ]);
    expect(countries.at(0)?.certification).toBe('18');
    expect(countries.at(0)?.dates.map(({ certification, notes }) => [certification, notes])).toEqual([
      ['15', []],
      ['', []],
      ['', ['<b>Festival</b>']],
    ]);
  });

  it('should turn disc names in a physical note into format logos and keep the rest as tags', () => {
    const dates = map([
      { ...row('us', '2000-04-18', 'physical'), note: '4K Ultra HD / Blu-ray / DVD / Steelbook' },
      { ...row('us', '2000-04-01', 'digital'), note: 'iTunes / Apple TV' },
    ]).countries.at(0)?.dates;
    expect(dates?.map(({ formats, notes }) => [formats.map(({ logo }) => logo), notes])).toEqual([
      [[], ['iTunes / Apple TV']],
      [['bluray_ultrahd', 'bluray', 'dvd'], ['Steelbook']],
    ]);
  });

  describe('for the featured country', () => {
    const releases = [
      row('us', '1999-10-10', 'premiere'),
      row('us', '1999-10-15'),
      row('us', '1999-11-19', 'digital'),
      row('us', '2000-04-18', 'physical'),
      row('gb', '1999-11-12'),
    ];

    it("should pick the viewer's country, then the original country", () => {
      expect(map(releases, { viewerCountry: 'GB' }).featured).toMatchObject({ code: 'gb', tag: 'Your Country' });
      expect(map(releases, { viewerCountry: 'de' }).featured).toMatchObject({ code: 'us', tag: 'Original Country' });
      expect(map(releases, { originalCountry: 'fr' }).featured).toBeUndefined();
    });

    it('should mark released stops, today after the last one and a countdown on the next', () => {
      const stops = map(releases).featured?.stops;
      expect(stops?.map(({ released, today, countdown }) => [released, today, countdown])).toEqual([
        [true, false, null],
        [true, true, null],
        [false, false, 30],
        [false, false, null],
      ]);
      expect(map(releases, { today: '1999-11-18' }).featured?.stops.at(2)?.countdown).toBe(1);
      expect(map(releases, { today: '1999-10-01' }).featured?.stops.some(({ today }) => today)).toBe(false);
    });
  });

  it('should return no countries and no featured country for an empty list', () => {
    expect(map([])).toMatchObject({ columns: [], countries: [], featured: undefined });
  });
});
