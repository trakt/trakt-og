import { describe, expect, it } from 'vitest';
import { postCredits } from './postCredits.ts';

describe('postCredits', () => {
  it('should count a scene after the credits', () => {
    expect(postCredits({ during: false, after: true })).toEqual({ count: 1, hint: 'A scene after the credits' });
  });

  it('should count a scene during the credits', () => {
    expect(postCredits({ during: true, after: null })).toEqual({ count: 1, hint: 'A scene during the credits' });
  });

  it('should count both', () => {
    expect(postCredits({ during: true, after: true })).toEqual({
      count: 2,
      hint: 'Scenes during and after the credits',
    });
  });

  it('should be nothing without a scene', () => {
    expect(postCredits({ during: false, after: false })).toBeUndefined();
    expect(postCredits({})).toBeUndefined();
  });
});
