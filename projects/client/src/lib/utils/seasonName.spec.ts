import { describe, expect, it } from 'vitest';
import { seasonName } from './seasonName.ts';

describe('util: seasonName', () => {
  it('should call season 0 Specials', () => {
    expect(seasonName(0)).toBe('Specials');
  });

  it('should number every other season', () => {
    expect([1, 12].map(seasonName)).toEqual(['Season 1', 'Season 12']);
  });
});
