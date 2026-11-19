import { describe, expect, it } from 'vitest';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { socialWindows } from './socialWindows.ts';
import { toSocialDetails } from './toSocialDetails.ts';
import { toSocialItem } from './toSocialItem.ts';

const now = new Date('2026-09-30T12:00:30.500Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const items = socialFeedFixture.rows(now).map((row) => toSocialItem(row, datePreferences));
const windows = socialWindows('week', now, 'UTC');
const on = (key: string) =>
  toSocialDetails(
    items.filter(({ title }) => title.key === key),
    windows,
  );

describe('toSocialDetails', () => {
  it('should list each person once, latest first, with what they watched and their rating', () => {
    expect(on('show:slow-horses').map(({ member, watched, rating }) => [member.key, watched, rating])).toEqual([
      ['sample-ana', '2 episodes', 9],
      ['sample-rook', '3 episodes', 10],
      ['sample-sefer', '2 episodes', undefined],
      ['sample-noor', '5x01', 9],
      ['sample-damien', '3 episodes', undefined],
    ]);
  });

  it('should link what they watched to their history for the period, limited to the title', () => {
    expect(on('show:slow-horses')[0]?.history).toBe(
      '/users/sample-ana/history?start_at=2026-09-23T12%3A00%3A00.000Z&end_at=2026-09-30T12%3A00%3A00.000Z&show=155534',
    );
  });

  it("should say Watched for a movie, and link a person's comment", () => {
    expect(on('movie:weapons-2025')[0]?.watched).toBe('Watched');
    expect(on('show:slow-horses').find(({ comment }) => comment)?.comment).toEqual({
      href: '/comments/223',
      review: false,
    });
  });
});
