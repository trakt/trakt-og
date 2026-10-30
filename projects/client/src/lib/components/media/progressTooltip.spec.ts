import { describe, expect, it } from 'vitest';
import { progressTooltip } from './progressTooltip.ts';
import { watchedProgressText } from './watchedProgressText.ts';

describe('progressTooltip', () => {
  it('should give the percent, episodes, plays and their time', () => {
    const progress = { aired: 154, completed: 133, plays: 203, minutesWatched: 4496, minutesLeft: 523 };

    expect(watchedProgressText(progressTooltip({ progress, runtime: 25 }))).toBe(
      '86% watched, 133 / 154 eps — 203 plays (3d 2h 56m)',
    );
  });

  it('should estimate missing minutes from the runtime, like OG', () => {
    const progress = { aired: 10, completed: 4, plays: 5, minutesWatched: 0, minutesLeft: null };

    expect(progressTooltip({ progress, runtime: 30 }).at(0)?.minutes).toBe(150);
  });

  it('should add the whole show under a rewatch', () => {
    const progress = { aired: 50, completed: 5, plays: 5, minutesWatched: 300, minutesLeft: 2700 };
    const fullProgress = { aired: 50, completed: 50, plays: 55, minutesWatched: 3300, minutesLeft: 0 };

    expect(
      progressTooltip({ progress, fullProgress, runtime: 60 }).map(({ verb, percent }) => ({ verb, percent })),
    ).toEqual([
      { verb: 'rewatched', percent: 10 },
      { verb: 'watched', percent: 100 },
    ]);
  });

  it('should group thousands', () => {
    const progress = { aired: 2000, completed: 1500, plays: 1500, minutesWatched: 1, minutesLeft: 1 };

    expect(watchedProgressText(progressTooltip({ progress }))).toContain('1,500 / 2,000 eps — 1,500 plays');
  });
});
