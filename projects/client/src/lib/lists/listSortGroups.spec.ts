import { describe, expect, it } from 'vitest';
import { listItemSorts } from './listItemSorts.ts';
import { listSortGroups } from './listSortGroups.ts';

describe('util: listSortGroups', () => {
  it('should split the menu into its sections in order, the first without a header', () => {
    const groups = listSortGroups(listItemSorts);
    expect(groups.map(({ group, header }) => [group, header])).toEqual([
      ['main', undefined],
      ['site', 'Site Ratings'],
      ['votes', 'Votes'],
      ['mine', 'Your data'],
    ]);
  });

  it('should leave out a section with no sorts', () => {
    const groups = listSortGroups(listItemSorts.filter(({ group }) => group !== 'mine'));
    expect(groups.map(({ group }) => group)).toEqual(['main', 'site', 'votes']);
  });
});
