import { describe, expect, it } from 'vitest';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { socialWindows } from './socialWindows.ts';
import { averageRating, toCircleEvents } from './toCircleEvents.ts';
import { toSocialItem } from './toSocialItem.ts';

const now = new Date('2026-09-30T12:00:30.500Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const week = socialFeedFixture.rows(now).map((row) => toSocialItem(row, datePreferences));
const windows = socialWindows('week', now, 'UTC');
const today = week.filter(({ at }) => Date.parse(at) >= now.getTime() - 86_400_000);

describe('toCircleEvents', () => {
  it('should feature the title the most people are on, with who did what', () => {
    const { featured } = toCircleEvents(week, 8, windows);

    expect(featured?.title.key).toBe('show:slow-horses');
    expect(featured?.people.map(({ key }) => key)).toEqual([
      'sample-ana',
      'sample-rook',
      'sample-sefer',
      'sample-noor',
      'sample-damien',
    ]);
    expect(featured?.watched).toHaveLength(5);
    expect(featured?.plays).toBe(11);
    expect(featured?.details.map(({ member }) => member.key)).toEqual(featured?.people.map(({ key }) => key));
    expect(featured?.ratings).toEqual([9, 10, 9]);
    expect(featured?.commented.map(({ key }) => key)).toEqual(['sample-sefer']);
    expect(featured?.tag).toEqual({ kind: 'binge', episodes: 3 });
  });

  it('should list the next titles three or more people are on as standouts', () => {
    expect(toCircleEvents(week, 8, windows).standouts.map(({ title }) => title.key)).toEqual([
      'show:lanterns',
      'show:severance',
    ]);
  });

  it("should count an episode's rating as being on the show, but leave it out of the show's ratings", () => {
    const lanterns = toCircleEvents(week, 8, windows).standouts.find(({ title }) => title.key === 'show:lanterns');

    expect(lanterns?.people.map(({ key }) => key)).toContain('sample-technicolour');
    expect(lanterns?.ratings).toEqual([8, 10]);
  });

  it('should not feature a title too small a share of who you follow is on', () => {
    const { featured, standouts } = toCircleEvents(week, 120, windows);

    expect(featured).toBeNull();
    expect(standouts.map(({ title }) => title.key)).toEqual(['show:slow-horses', 'show:lanterns', 'show:severance']);
  });

  it('should go by people alone when the follow count did not load', () => {
    expect(toCircleEvents(week, null, windows).featured?.title.key).toBe('show:slow-horses');
  });

  it('should feature nothing when no title has enough people, and keep the standouts', () => {
    const { featured, standouts } = toCircleEvents(today, 8, windows);

    expect(featured).toBeNull();
    expect(standouts.map(({ title }) => title.key)).toEqual(['show:lanterns']);
  });

  it('should average ratings, with none undefined', () => {
    expect(averageRating([9, 10, 9])).toBeCloseTo(9.33);
    expect(averageRating([])).toBeUndefined();
  });
});
