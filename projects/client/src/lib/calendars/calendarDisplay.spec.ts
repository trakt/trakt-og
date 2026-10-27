import { describe, expect, it } from 'vitest';
import { calendarDisplay } from './calendarDisplay.ts';

const cookies = (values: Record<string, string>) => ({ get: (name: string) => values[name] });

describe('calendarDisplay', () => {
  it('should default to the month, posters and grouped episodes', () => {
    expect(calendarDisplay({ cookies: cookies({}) })).toEqual({
      view: 'month',
      artwork: 'poster',
      episodes: 'grouped',
    });
  });

  it("should take the viewer's picks from the cookies and ignore anything else", () => {
    const picked = cookies({ calendar_view: 'list', calendar_artwork: 'screenshot', calendar_episodes: 'each' });
    expect(calendarDisplay({ cookies: picked })).toEqual({
      view: 'list',
      artwork: 'screenshot',
      episodes: 'each',
    });
    const junk = cookies({ calendar_view: 'week', calendar_artwork: 'banner', calendar_episodes: 'x' });
    expect(calendarDisplay({ cookies: junk })).toEqual({
      view: 'month',
      artwork: 'poster',
      episodes: 'grouped',
    });
  });

  it('should take the agenda view from the cookie', () => {
    const picked = cookies({ calendar_view: 'agenda' });
    expect(calendarDisplay({ cookies: picked }).view).toBe('agenda');
  });
});
