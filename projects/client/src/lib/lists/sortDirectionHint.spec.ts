import { describe, expect, it } from 'vitest';
import { sortDirectionHint } from './sortDirectionHint.ts';

describe('util: sortDirectionHint', () => {
  it('should read rank as positions', () => {
    expect(sortDirectionHint('rank', 'asc')).toBe('first to last');
    expect(sortDirectionHint('rank', 'desc')).toBe('last to first');
  });

  it('should read title alphabetically', () => {
    expect(sortDirectionHint('title', 'asc')).toBe('A to Z');
    expect(sortDirectionHint('title', 'desc')).toBe('Z to A');
  });

  it('should read dates by age', () => {
    expect(sortDirectionHint('added', 'asc')).toBe('oldest first');
    expect(sortDirectionHint('watched', 'desc')).toBe('newest first');
  });

  it('should read runtime by length', () => {
    expect(sortDirectionHint('runtime', 'desc')).toBe('longest first');
  });

  it('should read scores and counts as low or high', () => {
    expect(sortDirectionHint('percentage', 'asc')).toBe('low to high');
    expect(sortDirectionHint('imdb_votes', 'desc')).toBe('high to low');
  });

  it('should have nothing for random', () => {
    expect(sortDirectionHint('random', 'asc')).toBeUndefined();
  });
});
