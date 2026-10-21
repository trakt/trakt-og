import { describe, expect, it } from 'vitest';
import { calendarTags } from './calendarTags.ts';

const premiere = { text: 'Season Premiere', kind: 'season-premiere' as const };
const time = { text: '9:00 pm' };
const network = { text: 'FX', kind: 'generic' as const };
const episode = { episode: true, tags: [premiere, time, network] };
const movie = { episode: false };

describe('calendarTags', () => {
  describe('for episodes', () => {
    it('should split the episode type from the air time and network', () => {
      expect(calendarTags({ entry: episode, mixed: false })).toEqual({ types: [premiere], line: [time, network] });
    });

    it('should leave the air time out when the time is shown elsewhere', () => {
      expect(calendarTags({ entry: episode, mixed: true, time: false })).toEqual({
        types: [premiere],
        line: [network],
      });
    });

    it('should have no types for a plain episode', () => {
      expect(calendarTags({ entry: { episode: true, tags: [time] }, mixed: false })).toEqual({
        types: [],
        line: [time],
      });
    });
  });

  describe('for movies', () => {
    it('should tag a movie on a calendar that mixes in shows', () => {
      expect(calendarTags({ entry: movie, mixed: true })).toEqual({
        types: [],
        line: [{ text: 'Movie', kind: 'generic' }],
      });
    });

    it('should leave a movie untagged on a movies-only calendar', () => {
      expect(calendarTags({ entry: movie, mixed: false })).toEqual({ types: [], line: [] });
    });
  });
});
