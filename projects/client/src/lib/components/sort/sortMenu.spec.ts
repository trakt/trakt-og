import { describe, expect, it } from 'vitest';
import { listItemSorts } from '../../lists/listItemSorts.ts';
import { flyoutHolds, type SortMenuEntry, sortMenu, withTraktSorts } from './sortMenu.ts';

const names = (section: readonly SortMenuEntry[]) =>
  section.map((entry) => (entry.kind === 'sort' ? entry.sort.by : entry.flyout.label));

describe('util: sortMenu', () => {
  it('should list the everyday sorts, then a row per site, then the viewer’s data', () => {
    expect(sortMenu(listItemSorts).map(names)).toEqual([
      ['rank', 'added', 'title', 'released', 'runtime', 'random'],
      ['Trakt', 'IMDb', 'TMDB', 'Rotten Tomatoes', 'Metacritic'],
      ['My Data'],
    ]);
  });

  it('should group each site’s rating and votes under it by their short names', () => {
    const [, sites] = sortMenu(listItemSorts);
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
    expect(sortMenu(signedOutPeople).map(names)).toEqual([
      ['rank', 'added', 'title', 'released', 'runtime', 'random'],
      ['Trakt'],
    ]);
  });

  it('should say which row holds the picked sort', () => {
    const [, sites] = sortMenu(listItemSorts);
    const imdb = sites?.find((entry) => entry.kind === 'flyout' && entry.flyout.key === 'imdb');
    if (imdb?.kind !== 'flyout') throw new Error('no IMDb row');
    expect(flyoutHolds(imdb.flyout, 'imdb_votes')).toBe(true);
    expect(flyoutHolds(imdb.flyout, 'tmdb_votes')).toBe(false);
  });

  it('should put Trakt’s community sorts under the Trakt row for a page without other sites', () => {
    const sorts = withTraktSorts([
      { by: 'added', label: 'Watched Date' },
      { by: 'percentage', label: 'Percentage' },
      { by: 'votes', label: 'Votes' },
    ]);
    expect(sorts.at(1)).toEqual({ by: 'percentage', label: 'Trakt Percentage', short: 'Percentage', site: 'trakt' });
    expect(sortMenu(sorts).map(names)).toEqual([['added'], ['Trakt']]);
  });
});
