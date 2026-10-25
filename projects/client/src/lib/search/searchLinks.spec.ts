import { describe, expect, it } from 'vitest';
import { searchTypes } from '../components/header/searchTypes.ts';
import { searchLinks } from './searchLinks.ts';

const flat = (groups: ReturnType<typeof searchLinks>) => groups.flatMap(({ links }) => links);

describe('searchLinks', () => {
  it('should group the text types under Trakt and the IDs under By ID, like the header search', () => {
    const groups = searchLinks(searchTypes[1], 'the office');
    expect(groups.map(({ label, links }) => [label, links.map((link) => link.label)])).toEqual([
      ['Trakt', ['Shows & Movies', 'Shows', 'Movies', 'People', 'Lists']],
      ['By ID', ['Trakt ID', 'IMDB ID', 'TMDB ID', 'TVDB ID']],
    ]);
  });

  it('should carry the query and mark the current type', () => {
    const links = flat(searchLinks(searchTypes[1], 'the office'));
    expect(links.at(0)?.href).toBe('/search?query=the+office');
    expect(links.filter((link) => link.current).map((link) => link.href)).toEqual(['/search/shows?query=the+office']);
  });

  it('should mark an ID type current in ID mode', () => {
    const links = flat(searchLinks(searchTypes[6], 'tt1'));
    expect(links.filter((link) => link.current).map((link) => link.href)).toEqual(['/search/imdb?query=tt1']);
  });

  it('should preserve filters and the edited query while dropping the previous page', () => {
    const links = flat(searchLinks(searchTypes[5], '2', new URLSearchParams('page=3&q=1&id_type=movie&limit=12')));
    expect(links.find((link) => link.label === 'IMDB ID')?.href).toBe('/search/imdb?id_type=movie&limit=12&query=2');
  });

  it('should leave the query off when there is none', () => {
    expect(flat(searchLinks(searchTypes[0], '')).at(1)?.href).toBe('/search/shows');
  });
});
