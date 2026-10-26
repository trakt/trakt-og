import { describe, expect, it } from 'vitest';
import { searchDisplay } from './searchDisplay.ts';

const cookies = (values: Record<string, string>) => ({ get: (name: string) => values[name] });
const settings = (imageType: unknown) => ({ browsing: { search: { image_type: imageType } } });

describe('searchDisplay', () => {
  it('should default to the grid and posters signed out, unset or unknown', () => {
    for (const viewer of [null, { browsing: null }, settings(null), settings('none')]) {
      expect(searchDisplay({ cookies: cookies({}), settings: viewer })).toEqual({ view: 'grid', artwork: 'poster' });
    }
  });

  it.each([
    ['poster', 'poster'],
    ['thumb', 'fanart'],
    ['screenshot', 'fanart'],
    ['fanart', 'fanart'],
    ['logo', 'logo'],
    ['banner', 'poster'],
  ])("should start a profile's %s image type on %s", (imageType, artwork) => {
    expect(searchDisplay({ cookies: cookies({}), settings: settings(imageType) }).artwork).toBe(artwork);
  });

  it("should take the viewer's picks from the cookies over the profile and ignore anything else", () => {
    const picked = cookies({ search_view: 'list', search_artwork: 'none' });
    expect(searchDisplay({ cookies: picked, settings: settings('logo') })).toEqual({ view: 'list', artwork: 'none' });
    const junk = cookies({ search_view: 'month', search_artwork: 'banner' });
    expect(searchDisplay({ cookies: junk, settings: settings('logo') })).toEqual({ view: 'grid', artwork: 'logo' });
  });
});
