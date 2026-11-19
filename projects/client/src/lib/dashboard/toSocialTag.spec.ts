import { describe, expect, it } from 'vitest';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { toSocialItem } from './toSocialItem.ts';
import { tagOf } from './toSocialTag.ts';

const now = new Date('2026-09-30T12:00:30.500Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const items = socialFeedFixture.rows(now).map((row) => toSocialItem(row, datePreferences));
const watches = items.filter(({ title, kind }) => title.key === 'show:slow-horses' && kind === 'watch');
const firstEach = watches.filter((item, i) => watches.findIndex(({ member }) => member.key === item.member.key) === i);

describe('tagOf', () => {
  it('should count 3 or more people watching a title', () => {
    expect(tagOf(firstEach)).toEqual({ kind: 'watchers', count: 5 });
    expect(tagOf(firstEach.slice(0, 2))).toBeUndefined();
  });

  it("should leave a premiere's tag off when they watched more than that episode", () => {
    expect(new Set(watches.map(({ code }) => code)).size).toBeGreaterThan(1);
    expect(tagOf(watches)?.kind).not.toBe('episode');
  });
});
