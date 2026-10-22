import { describe, expect, it } from 'vitest';
import { builtInListName } from './builtInListName.ts';

describe('util: builtInListName', () => {
  it('should name the watchlist Watchlist', () => {
    expect(builtInListName('watchlist')).toBe('Watchlist');
  });

  it('should name favorites Favorites', () => {
    expect(builtInListName('favorites')).toBe('Favorites');
  });
});
