import { describe, expect, it } from 'vitest';
import { episodesUpTo } from './episodesUpTo.ts';

const season = (number: number, watched: readonly number[], aired = 4) => ({
  number,
  episodes: Array.from({ length: aired }, (_, index) => ({
    number: index + 1,
    completed: watched.includes(index + 1),
  })),
});

describe('episodesUpTo', () => {
  it('should add earlier unwatched episodes in order, then this one', () => {
    const seasons = [season(2, [1]), season(1, [1, 3])];
    expect(episodesUpTo({ seasons, episode: { season: 2, number: 3 } })).toEqual({
      episodes: [
        { season: 1, number: 2 },
        { season: 1, number: 4 },
        { season: 2, number: 2 },
        { season: 2, number: 3 },
      ],
      skipped: 3,
    });
  });
  it('should leave specials and later episodes out', () => {
    const seasons = [season(0, []), season(1, []), season(2, [])];
    const { episodes } = episodesUpTo({ seasons, episode: { season: 1, number: 2 } });
    expect(episodes).toEqual([
      { season: 1, number: 1 },
      { season: 1, number: 2 },
    ]);
  });
  it('should count only earlier specials for a special', () => {
    const seasons = [season(0, [1]), season(1, [])];
    expect(episodesUpTo({ seasons, episode: { season: 0, number: 3 } })).toEqual({
      episodes: [
        { season: 0, number: 2 },
        { season: 0, number: 3 },
      ],
      skipped: 1,
    });
  });
  it('should add only the aired episodes progress lists', () => {
    const seasons = [season(1, [], 2), season(2, [], 1)];
    const { episodes } = episodesUpTo({ seasons, episode: { season: 2, number: 1 } });
    expect(episodes).toEqual([
      { season: 1, number: 1 },
      { season: 1, number: 2 },
      { season: 2, number: 1 },
    ]);
  });
  it('should return just this episode when everything before it is watched', () => {
    const seasons = [season(1, [1, 2, 3])];
    expect(episodesUpTo({ seasons, episode: { season: 1, number: 4 } })).toEqual({
      episodes: [{ season: 1, number: 4 }],
      skipped: 3,
    });
  });
});
