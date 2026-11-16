import { describe, expect, it } from 'vitest';
import { toCertificationGroups } from './toCertificationGroups.ts';

// Phony's ratings, as the API gave them.
const certifications = [
  { certification: '14', country: 'br' },
  { certification: '15', country: 'kr' },
  { certification: '18', country: 'pl' },
  { certification: 'NC16', country: 'sg' },
  { certification: '18+', country: 'tr' },
  { certification: 'TV-MA', country: 'us' },
];

describe('toCertificationGroups', () => {
  it('should group the countries by the youngest age, youngest first and by name inside', () => {
    const { groups, count } = toCertificationGroups({ certifications, origin: 'us', viewer: null });
    expect(count).toBe(6);
    expect(groups.map(({ label, countries }) => [label, countries.map(({ code }) => code)])).toEqual([
      ['14+', ['br']],
      ['15+', ['kr']],
      ['16+', ['sg']],
      ['17+', ['us']],
      ['18+', ['pl', 'tr']],
    ]);
  });

  it("should lead with the origin country and the viewer's, and mark the origin's group", () => {
    const { featured, groups } = toCertificationGroups({ certifications, origin: 'us', viewer: 'kr' });
    expect(featured.map(({ code, certification, tags }) => [code, certification, tags])).toEqual([
      ['us', 'TV-MA', ['Original Country']],
      ['kr', '15', ['Your Country']],
    ]);
    expect(groups.filter(({ original }) => original).map(({ label }) => label)).toEqual(['17+']);
  });

  it("should lead with one entry when the viewer's country is the origin, and skip an unrated viewer's", () => {
    expect(
      toCertificationGroups({ certifications, origin: 'us', viewer: 'us' }).featured.map(({ tags }) => tags),
    ).toEqual([['Original Country', 'Your Country']]);
    expect(
      toCertificationGroups({ certifications, origin: 'us', viewer: 'de' }).featured.map(({ code }) => code),
    ).toEqual(['us']);
  });

  it('should close with Other for ratings that name no age, and skip a country listed twice', () => {
    const { groups, featured } = toCertificationGroups({
      certifications: [
        { certification: 'PG', country: 'gb' },
        { certification: 'U', country: 'gb' },
        { certification: 'G', country: 'us' },
      ],
      origin: null,
      viewer: null,
    });
    expect(featured).toEqual([]);
    expect(groups.map(({ label, countries }) => [label, countries.map(({ certification }) => certification)])).toEqual([
      ['All Ages', ['G']],
      ['Other', ['PG']],
    ]);
  });
});
