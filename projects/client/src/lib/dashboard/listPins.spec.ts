import { describe, expect, it } from 'vitest';
import { listPinsSchema, pinFor, pinHref, pinItemsBase } from './listPins.ts';

describe('listPins', () => {
  describe('pinFor', () => {
    it("should name the owner of someone else's list", () => {
      const list = { kind: 'personal', id: 12, ownerSlug: 'justin', name: 'Criterion' } as const;

      expect(pinFor({ list, viewer: 'sean', owner: { username: 'JustinN', avatar: 'a.jpg' } })).toEqual({
        kind: 'personal',
        id: '12',
        owner: 'justin',
        name: 'Criterion',
        by: 'JustinN',
        avatar: 'a.jpg',
      });
      expect(pinFor({ list, viewer: 'justin', owner: { username: 'JustinN', avatar: 'a.jpg' } })).not.toHaveProperty(
        'by',
      );
    });

    it("should leave out the viewer's own watchlist but not someone else's", () => {
      const list = { kind: 'watchlist', id: 0, ownerSlug: 'justin', name: 'Watchlist' } as const;

      expect(pinFor({ list, viewer: 'justin', owner: {} })).toBeNull();
      expect(pinFor({ list, viewer: 'sean', owner: {} })).toMatchObject({ id: '', owner: 'justin' });
    });

    it('should keep no owner for an official list', () => {
      const list = { kind: 'official', id: 9, ownerSlug: 'trakt', name: 'Oscars' } as const;

      expect(pinFor({ list, viewer: 'sean', owner: {} })).toEqual({
        kind: 'official',
        id: '9',
        owner: '',
        name: 'Oscars',
      });
    });
  });

  it('should link and read each kind of list where it lives', () => {
    const base = { name: 'x', owner: 'sean' };

    expect(pinHref({ ...base, kind: 'smart', id: 'sci-fi' })).toBe('/users/sean/smart-lists/sci-fi');
    expect(pinHref({ ...base, kind: 'personal', id: '12' })).toBe('/users/sean/lists/12');
    expect(pinHref({ ...base, kind: 'official', id: '9', owner: '' })).toBe('/lists/9');
    expect(pinHref({ ...base, kind: 'favorites', id: '' })).toBe('/users/sean/favorites');
    expect(pinItemsBase({ ...base, kind: 'personal', id: '12' })).toBe('/users/sean/lists/12/items');
    expect(pinItemsBase({ ...base, kind: 'official', id: '9', owner: '' })).toBe('/lists/9/items');
    expect(pinItemsBase({ ...base, kind: 'watchlist', id: '' })).toBe('/users/sean/watchlist');
  });

  it('should drop unreadable and repeated pins and keep five', () => {
    const pin = (id: string) => ({ kind: 'personal', id, owner: 'sean', name: id });

    expect(listPinsSchema.parse('nope')).toEqual([]);
    expect(listPinsSchema.parse([pin('1'), { kind: 'board' }, pin('1'), pin('2')])).toEqual([pin('1'), pin('2')]);
    expect(listPinsSchema.parse(['1', '2', '3', '4', '5', '6'].map(pin))).toHaveLength(5);
  });
});
