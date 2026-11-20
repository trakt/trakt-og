import { describe, expect, it } from 'vitest';
import type { ListItemRow } from './listItemRowsSchema.ts';
import { matchesListTerms } from './matchesListTerms.ts';

const listed = { rank: 1, id: 1, listed_at: '2026-01-01T00:00:00.000Z' };
const show = { title: 'Breaking Bad', ids: { trakt: 1, slug: 'breaking-bad' } };
const movie: ListItemRow = { type: 'movie', movie: { title: 'Heat', ids: { trakt: 2, slug: 'heat' } }, ...listed };
const episode: ListItemRow = {
  type: 'episode',
  show,
  episode: { title: 'Ozymandias', season: 5, number: 14, ids: { trakt: 3 } },
  ...listed,
};
const season: ListItemRow = { type: 'season', show, season: { title: null, number: 5, ids: { trakt: 4 } }, ...listed };
const person: ListItemRow = { type: 'person', person: { name: 'Al Pacino', ids: { trakt: 5, slug: 'al' } }, ...listed };

describe('util: matchesListTerms', () => {
  it('should keep every item without terms', () => {
    expect(matchesListTerms(movie, undefined)).toBe(true);
    expect(matchesListTerms(movie, '  ')).toBe(true);
  });

  it('should match every word of the terms in the title, ignoring case', () => {
    expect(matchesListTerms(movie, ' HEAT ')).toBe(true);
    expect(matchesListTerms(movie, 'heat ronin')).toBe(false);
    expect(matchesListTerms(person, 'pacino al')).toBe(true);
  });

  it("should match a season or episode by its show's title too", () => {
    expect(matchesListTerms(episode, 'breaking ozymandias')).toBe(true);
    expect(matchesListTerms(season, 'bad')).toBe(true);
    expect(matchesListTerms(season, 'heat')).toBe(false);
  });
});
