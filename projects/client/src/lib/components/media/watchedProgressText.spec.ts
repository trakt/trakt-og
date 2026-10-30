import { describe, expect, it } from 'vitest';
import { watchedProgressText } from './watchedProgressText.ts';

describe('watchedProgressText', () => {
  it('should read a run like the summary button: percent, episodes, plays and time', () => {
    expect(watchedProgressText([{ verb: 'watched', percent: 3, completed: 1, aired: 32, plays: 1, minutes: 49 }])).toBe(
      '3% watched, 1 / 32 eps — 1 play (49m)',
    );
  });

  it('should drop the plays and time when they are unknown', () => {
    expect(watchedProgressText([{ verb: 'watched', percent: 60, completed: 12, aired: 20 }])).toBe(
      '60% watched, 12 / 20 eps',
    );
  });

  it('should put a rewatch before the whole show', () => {
    expect(
      watchedProgressText([
        { verb: 'rewatched', percent: 10, completed: 2, aired: 20, plays: 2 },
        { verb: 'watched', percent: 100, completed: 20, aired: 20, plays: 22, minutes: 1320 },
      ]),
    ).toBe('10% rewatched, 2 / 20 eps — 2 plays; 100% watched, 20 / 20 eps — 22 plays (22h)');
  });

  it("should name the library's media server", () => {
    expect(watchedProgressText([{ verb: 'in library', percent: 84, completed: 27, aired: 32, from: 'Plex' }])).toBe(
      '84% in library, 27 / 32 eps — from Plex',
    );
  });
});
