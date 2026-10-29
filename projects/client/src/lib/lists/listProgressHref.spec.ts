import { describe, expect, it } from 'vitest';
import { listProgressHref } from './listProgressHref.ts';

const list = { id: 42, kind: 'personal', ownerSlug: 'sean' } as const;

describe('listProgressHref', () => {
  it('should link a personal list by its id', () => {
    expect(listProgressHref({ list, viewerSlug: 'kim' })).toBe('/users/kim/progress?list=42');
  });

  it('should link the watchlist and favorites by owner, whatever their id', () => {
    expect(listProgressHref({ list: { ...list, kind: 'watchlist' }, viewerSlug: 'kim' })).toBe(
      '/users/kim/progress?list=sean/watchlist',
    );
    expect(listProgressHref({ list: { ...list, id: null, kind: 'favorites' }, viewerSlug: 'sean' })).toBe(
      '/users/sean/progress?list=sean/favorites',
    );
  });

  it('should leave out official lists and a personal list without its id', () => {
    expect(listProgressHref({ list: { ...list, kind: 'official' }, viewerSlug: 'kim' })).toBeUndefined();
    expect(listProgressHref({ list: { ...list, id: null }, viewerSlug: 'kim' })).toBeUndefined();
    expect(listProgressHref({ list: { ...list, id: 0 }, viewerSlug: 'kim' })).toBeUndefined();
  });
});
