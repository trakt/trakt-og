import { describe, expect, it } from 'vitest';
import { searchListType } from './searchListType.ts';

describe('searchListType', () => {
  it('should read personal and official', () => {
    expect(searchListType('personal')).toBe('personal');
    expect(searchListType('official')).toBe('official');
  });

  it('should be all when missing or unknown', () => {
    expect(searchListType(null)).toBe('all');
    expect(searchListType('')).toBe('all');
    expect(searchListType('watchlists')).toBe('all');
  });
});
