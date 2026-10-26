import { describe, expect, it } from 'vitest';
import type { SearchCard } from './SearchCard.ts';
import { searchResultTags } from './searchResultTags.ts';

const card = (fields: Partial<SearchCard>): SearchCard => ({
  key: 'k',
  type: 'movie',
  id: 1,
  href: '/movies/the-batman-2022',
  title: 'The Batman',
  year: 2022,
  art: {},
  tags: [],
  released: true,
  ...fields,
});

describe('searchResultTags', () => {
  it("should lead a mixed tab's movie with its type, then its certificate, runtime and genres", () => {
    const movie = card({
      tags: [{ text: 'Movie' }, { text: '2h 56m', kind: 'generic' }],
      certification: 'PG-13',
      runtime: 176,
      genres: ['Crime', 'Superhero'],
    });
    expect(searchResultTags(movie)).toEqual([
      { text: 'Movie', kind: 'primary' },
      { text: 'PG-13', kind: 'badge' },
      { segments: ['2h 56m'] },
      { segments: ['Crime', 'Superhero'] },
    ]);
  });

  it("should leave out a single-type tab's type and a show's runtime, and end on its network", () => {
    const show = card({
      type: 'show',
      tags: [{ text: 'AMC', kind: 'generic' }],
      runtime: 45,
      airedEpisodes: 62,
      genres: ['Drama'],
      network: 'AMC',
    });
    expect(searchResultTags(show)).toEqual([{ segments: ['62 episodes'] }, { segments: ['Drama'] }, { text: 'AMC' }]);
  });

  it('should keep the card tags for an episode or a person, the type in red', () => {
    const person = card({ type: 'person', tags: [{ text: 'Person' }, { text: 'Acting', kind: 'generic' }] });
    expect(searchResultTags(person)).toEqual([{ text: 'Person', kind: 'primary' }, { text: 'Acting' }]);
  });
});
