import { describe, expect, it } from 'vitest';
import { listSelection, toListFilter } from './listSelection.ts';

describe('listSelection', () => {
  it('should read kept and left-out values from every list shape', () => {
    expect(listSelection({ values: ['drama'], mode: 'any' })).toEqual({ include: ['drama'], exclude: [] });
    expect(listSelection({ values: ['crime'], mode: 'none' })).toEqual({ include: [], exclude: ['crime'] });
    expect(listSelection({ values: ['drama'], mode: 'any', excluded: ['crime'] })).toEqual({
      include: ['drama'],
      exclude: ['crime'],
    });
  });
});

describe('toListFilter', () => {
  it("should write OG's shapes back", () => {
    expect(toListFilter({ include: [], exclude: [] })).toEqual({ values: [], mode: 'any' });
    expect(toListFilter({ include: [], exclude: ['crime'] })).toEqual({ values: ['crime'], mode: 'none' });
    expect(toListFilter({ include: ['drama'], exclude: [] }, 'all')).toEqual({ values: ['drama'], mode: 'all' });
    expect(toListFilter({ include: ['drama'], exclude: ['crime'] })).toEqual({
      values: ['drama'],
      mode: 'any',
      excluded: ['crime'],
    });
  });

  it('should round-trip with listSelection', () => {
    const list = { values: ['drama', 'comedy'], mode: 'any' as const, excluded: ['crime'] };
    expect(toListFilter(listSelection(list), list.mode)).toEqual(list);
  });
});
