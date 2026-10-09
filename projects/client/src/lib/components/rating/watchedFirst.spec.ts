import { describe, expect, it } from 'vitest';
import { watchedFirst } from './watchedFirst.ts';

describe('watchedFirst', () => {
  it('should allow rating and favoriting once watched', () => {
    expect(watchedFirst({ watched: true }, 'rate')).toBeUndefined();
    expect(watchedFirst({ watched: true }, 'favorite')).toBeUndefined();
  });

  it('should lock both with a hint until watched', () => {
    expect(watchedFirst({ watched: false, rating: null }, 'rate')).toBe('Watch it first to rate it');
    expect(watchedFirst({ watched: false, favorited: false }, 'favorite')).toBe('Watch it first to favorite it');
  });

  it('should stay allowed while the watched state is unknown', () => {
    expect(watchedFirst({}, 'rate')).toBeUndefined();
  });

  it('should keep an existing rating or favorite open so it can be changed or removed', () => {
    expect(watchedFirst({ watched: false, rating: 7 }, 'rate')).toBeUndefined();
    expect(watchedFirst({ watched: false, favorited: true }, 'favorite')).toBeUndefined();
  });
});
