import { describe, expect, it } from 'vitest';
import { toShareArrivalType } from './toShareArrivalType.ts';

describe('util: toShareArrivalType', () => {
  it('should name the shared item from its route id', () => {
    expect(toShareArrivalType('/movies/[id]')).toBe('movie');
    expect(toShareArrivalType('/shows/[id]')).toBe('show');
    expect(toShareArrivalType('/shows/[id]/seasons/[season]')).toBe('season');
    expect(toShareArrivalType('/shows/[id]/seasons/[season]/episodes/[episode]')).toBe('episode');
    expect(toShareArrivalType('/people/[id]')).toBe('person');
    expect(toShareArrivalType('/users/[id]/lists/[list]')).toBe('list');
    expect(toShareArrivalType('/lists/official/[slug]')).toBe('list');
  });

  it('should fall back to other off an item page', () => {
    expect(toShareArrivalType('/users/[id]')).toBe('other');
    expect(toShareArrivalType('/movies/[id]/videos')).toBe('other');
    expect(toShareArrivalType(null)).toBe('other');
  });
});
