import { describe, expect, it } from 'vitest';
import { calendarDisplay } from './calendarDisplay.ts';

const cookies = (values: Record<string, string>) => ({ get: (name: string) => values[name] });

describe('calendarDisplay', () => {
  it('should default to the list, the account artwork and grouped episodes', () => {
    expect(calendarDisplay({ cookies: cookies({}), accountArtwork: 'poster', imagesAllowed: true })).toEqual({
      view: 'list',
      artwork: 'poster',
      episodes: 'grouped',
    });
  });

  it("should take the viewer's picks from the cookies and ignore anything else", () => {
    const picked = cookies({ calendar_view: 'month', calendar_artwork: 'screenshot', calendar_episodes: 'each' });
    expect(calendarDisplay({ cookies: picked, accountArtwork: 'logo', imagesAllowed: true })).toEqual({
      view: 'month',
      artwork: 'screenshot',
      episodes: 'each',
    });
    const junk = cookies({ calendar_view: 'week', calendar_artwork: 'banner', calendar_episodes: 'x' });
    expect(calendarDisplay({ cookies: junk, accountArtwork: 'thumb', imagesAllowed: true })).toEqual({
      view: 'list',
      artwork: 'logo',
      episodes: 'grouped',
    });
  });

  it('should keep logos for accounts without artwork choices', () => {
    const picked = cookies({ calendar_artwork: 'poster' });
    expect(calendarDisplay({ cookies: picked, accountArtwork: 'poster', imagesAllowed: false }).artwork).toBe('logo');
  });
});
