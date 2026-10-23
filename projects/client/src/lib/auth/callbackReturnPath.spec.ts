import { describe, expect, it } from 'vitest';
import { callbackReturnPath } from './callbackReturnPath.ts';

describe('callbackReturnPath', () => {
  it('should return the local path login stored', () => {
    expect(callbackReturnPath({ returnTo: '/shows/the-boys-2019?tab=seasons' })).toBe(
      '/shows/the-boys-2019?tab=seasons',
    );
  });

  it('should still drop a stored path that leaves the site', () => {
    expect(callbackReturnPath({ returnTo: '//evil.example' })).toBe('/');
  });

  it.each([
    ['no state', undefined],
    ['a null state', null],
    ['a string state', '/shows'],
    ['a state without returnTo', {}],
    ['a returnTo of the wrong type', { returnTo: 42 }],
    ['an array', [{ returnTo: '/shows' }]],
  ])('should fall back to / for %s', (_, state) => {
    expect(callbackReturnPath(state)).toBe('/');
  });
});
