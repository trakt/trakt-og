import { describe, expect, it } from 'vitest';
import { toBirthdayRows } from './toBirthdayRows.ts';

const person = (
  trakt: number,
  birthday: string | null,
  more: { death?: string; known_for_department?: string } = {},
) => ({
  name: `Person ${trakt}`,
  ids: { trakt, slug: `person-${trakt}` },
  birthday,
  images: null,
  ...more,
});

describe('util: toBirthdayRows', () => {
  it("should put today's birthdays first, then the ones to come, then the past ones, 5 at most", () => {
    const rows = toBirthdayRows([
      person(1, '1969-10-01'),
      person(2, '1980-10-25'),
      person(3, '1990-10-10'),
      person(4, '1975-10-11'),
      person(5, '1960-10-09'),
      person(6, '1985-10-10'),
    ], '2026-10-10');

    expect(rows.map((row) => [row.title, row.tag])).toEqual([
      ['Person 3', 'Today'],
      ['Person 6', 'Today'],
      ['Person 4', 'Oct 11'],
      ['Person 2', 'Oct 25'],
      ['Person 1', 'Oct 1'],
    ]);
  });

  it('should leave out people with no birthday and link each to their page', () => {
    const rows = toBirthdayRows([person(1, null), person(2, '1980-10-12')], '2026-10-10');

    expect(rows).toEqual([{
      key: 'person-2',
      recent: { query: 'Person 2', type: 'people', id: 2 },
      href: '/people/person-2',
      title: 'Person 2',
      type: 'Person',
      tag: 'Oct 12',
      genres: ['45 years old'],
      poster: undefined,
    }]);
  });

  it("should tag the age they are today and what they're known for, with no age for someone who has died", () => {
    const rows = toBirthdayRows([
      person(1, '1968-10-12', { known_for_department: 'acting' }),
      person(2, '1968-10-10', { known_for_department: 'directing' }),
      person(3, '1930-10-11', { death: '2020-01-01', known_for_department: 'writing' }),
    ], '2026-10-10');

    expect(rows.map((row) => [row.title, row.genres])).toEqual([
      ['Person 2', ['58 years old', 'Directing']],
      ['Person 3', ['Writing']],
      ['Person 1', ['57 years old', 'Acting']],
    ]);
  });
});
