import { describe, expect, it } from 'vitest';
import { listItemSorts } from './listItemSorts.ts';
import { flyoutHolds, type ListSortMenuEntry, listSortMenu } from './listSortMenu.ts';

const names = (section: readonly ListSortMenuEntry[]) =>
  section.map((entry) => (entry.kind === 'sort' ? entry.sort.by : entry.flyout.label));

describe('util: listSortMenu', () => {
  it('should list the everyday sorts, then a row per site, then the viewer’s data', () => {
    expect(listSortMenu(listItemSorts).map(names)).toEqual([
      ['rank', 'added', 'title', 'released', 'runtime', 'random'],
      ['Trakt', 'IMDb', 'TMDB', 'Rotten Tomatoes', 'Metacritic'],
      ['My Data'],
    ]);
  });

  it('should group each site’s rating and votes under it by their short names', () => {
    const [, sites] = listSortMenu(listItemSorts);
    const shorts = sites?.map((entry) =>
      entry.kind === 'flyout' ? [entry.flyout.label, entry.flyout.sorts.map(({ short }) => short)] : [],
    );
    expect(shorts).toEqual([
      ['Trakt', ['Percentage', 'Votes']],
      ['IMDb', ['Rating', 'Votes']],
      ['TMDB', ['User Score', 'Votes']],
      ['Rotten Tomatoes', ['Tomatometer', 'Audience Score']],
      ['Metacritic', ['Metascore']],
    ]);
  });

  it('should leave out a site or section with no sorts', () => {
    const signedOutPeople = listItemSorts.filter(({ group, types }) => group !== 'mine' && !types);
    expect(listSortMenu(signedOutPeople).map(names)).toEqual([
      ['rank', 'added', 'title', 'released', 'runtime', 'random'],
      ['Trakt'],
    ]);
  });

  it('should say which row holds the picked sort', () => {
    const [, sites] = listSortMenu(listItemSorts);
    const imdb = sites?.find((entry) => entry.kind === 'flyout' && entry.flyout.key === 'imdb');
    if (imdb?.kind !== 'flyout') throw new Error('no IMDb row');
    expect(flyoutHolds(imdb.flyout, 'imdb_votes')).toBe(true);
    expect(flyoutHolds(imdb.flyout, 'tmdb_votes')).toBe(false);
  });
});
