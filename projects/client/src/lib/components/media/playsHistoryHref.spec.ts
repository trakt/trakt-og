import { describe, expect, it } from 'vitest';
import { playsHistoryHref } from './playsHistoryHref.ts';

describe('playsHistoryHref', () => {
  it('should link a signed-in viewer to their own plays of a title', () => {
    expect(playsHistoryHref('justin', { type: 'movie', id: 55753 })).toBe('/users/justin/history?movie=55753');
    expect(playsHistoryHref('justin', { type: 'show', id: 2302 })).toBe('/users/justin/history?show=2302');
    expect(playsHistoryHref('justin', { type: 'season', id: 3701 })).toBe('/users/justin/history?season=3701');
    expect(playsHistoryHref('justin', { type: 'episode', id: 182211 })).toBe('/users/justin/history?episode=182211');
  });

  it('should leave signed-out visitors and unknown titles unlinked', () => {
    expect(playsHistoryHref(undefined, { type: 'movie', id: 55753 })).toBeUndefined();
    expect(playsHistoryHref('justin', undefined)).toBeUndefined();
  });
});
