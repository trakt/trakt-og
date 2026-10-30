import { describe, expect, it } from 'vitest';
import { headerLinkPrefs } from './headerLinkPrefs.ts';

describe('headerLinkPrefs', () => {
  it('should read nothing for a member who never changed the bar', () => {
    expect(headerLinkPrefs.read(undefined, 'sean')).toBeNull();
    expect(headerLinkPrefs.read('{"justin":["discover"]}', 'sean')).toBeNull();
  });

  it("should read the member's links in order", () => {
    expect(headerLinkPrefs.read('{"sean":["watchlist","dashboard","movies-boxoffice"]}', 'sean')).toEqual([
      'watchlist',
      'dashboard',
      'movies-boxoffice',
    ]);
  });

  it('should read a bar with every link removed', () => {
    expect(headerLinkPrefs.read('{"sean":[]}', 'sean')).toEqual([]);
  });

  it('should drop repeats and keep at most the cap', () => {
    const ids = Array.from({ length: 20 }, (_, index) => `link-${index}`);
    expect(headerLinkPrefs.read(JSON.stringify({ sean: ['a', 'a', 'b'] }), 'sean')).toEqual(['a', 'b']);
    expect(headerLinkPrefs.read(JSON.stringify({ sean: ids }), 'sean')).toHaveLength(headerLinkPrefs.MAX);
  });

  describe('for unreadable values', () => {
    it('should read nothing', () => {
      expect(headerLinkPrefs.read('not json', 'sean')).toBeNull();
      expect(headerLinkPrefs.read('[1,2]', 'sean')).toBeNull();
      expect(headerLinkPrefs.read('{"sean":"watchlist"}', 'sean')).toBeNull();
      expect(headerLinkPrefs.read('{"sean":[1,2]}', 'sean')).toBeNull();
    });
  });

  it("should write the member's links and keep everyone else's", () => {
    const next = headerLinkPrefs.write('{"justin":["discover"]}', 'sean', ['watchlist', 'calendar']);
    expect(JSON.parse(next)).toEqual({ justin: ['discover'], sean: ['watchlist', 'calendar'] });
  });

  it('should drop a member who is back on the defaults', () => {
    const next = headerLinkPrefs.write(
      '{"justin":["discover"],"sean":["watchlist"]}',
      'sean',
      headerLinkPrefs.DEFAULTS,
    );
    expect(JSON.parse(next)).toEqual({ justin: ['discover'] });
  });

  it('should keep the defaults in another order', () => {
    const ids = headerLinkPrefs.DEFAULTS.toReversed();
    expect(JSON.parse(headerLinkPrefs.write(undefined, 'sean', ids))).toEqual({ sean: ids });
  });
});
