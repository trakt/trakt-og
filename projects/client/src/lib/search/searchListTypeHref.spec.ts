import { describe, expect, it } from 'vitest';
import { searchListTypeHref } from './searchListTypeHref.ts';

const url = (search = '') => new URL(`https://og.trakt.tv/search/lists${search}`);

describe('searchListTypeHref', () => {
  it('should set the type and drop the page', () => {
    expect(searchListTypeHref(url('?page=3'), 'official')).toBe('/search/lists?type=official');
  });

  it('should leave type out for All', () => {
    expect(searchListTypeHref(url('?type=personal'), 'all')).toBe('/search/lists');
  });

  it('should keep the other params', () => {
    expect(searchListTypeHref(url('?limit=12&type=official'), 'personal')).toBe('/search/lists?limit=12&type=personal');
  });
});
