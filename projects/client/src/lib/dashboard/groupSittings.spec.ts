import { describe, expect, it } from 'vitest';
import { groupSittings } from './groupSittings.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import type { SocialActivity } from './socialActivitySchema.ts';
import { toSocialItem } from './toSocialItem.ts';

const now = new Date('2026-10-05T16:30:00Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const items = (rows: readonly SocialActivity[]) => rows.map((row) => toSocialItem(row, datePreferences));
const signature = (rows: readonly SocialActivity[]) =>
  groupSittings(items(rows)).map(({ member, items: list }) => `${member.name}:${list.length}`).join(' ');

const at = (iso: string) => new Date(iso).toISOString();
const [template] = socialFeedFixture.rows(now).filter(({ action, type }) => action === 'watch' && type === 'episode');
const watch = (id: number, iso: string, slug = 'sample-rook') => {
  if (!template) throw new Error('no fixture watch');
  return {
    ...template,
    id,
    activity_at: at(iso),
    user: { ...template.user, username: slug, name: 'Rook', ids: { slug } },
  };
};

describe('groupSittings', () => {
  it('should keep a member in one sitting while other members watch in between', () => {
    expect(signature(socialFeedFixture.rows(now))).toBe(
      'Kristin:3 Sefer:2 Damien:4 MajorMercyFlush:4 Technicolour:3 Kristin:33 Sefer:1 Justin:2 Rook:1',
    );
  });

  it('should key each sitting by its member and newest row', () => {
    const [first] = groupSittings(items(socialFeedFixture.rows(now)));

    expect(first?.key).toBe('sample-kristin:watch:17');
    expect(first?.newest).toBe('2026-10-05T16:06:00.000Z');
    expect(first?.oldest).toBe('2026-10-05T15:13:00.000Z');
  });

  it('should start a new sitting after a gap of more than 6 hours', () => {
    const rows = [watch(3, '2026-10-05T04:24:00Z'), watch(2, '2026-10-05T03:56:00Z'), watch(1, '2026-10-04T21:10:00Z')];

    expect(signature(rows)).toBe('Rook:2 Rook:1');
  });

  it('should keep a binge across midnight or 5 AM in one sitting', () => {
    const rows = [watch(4, '2026-10-05T06:30:00Z'), watch(3, '2026-10-05T05:38:00Z'), watch(2, '2026-10-05T04:41:00Z')];

    expect(signature([...rows, watch(1, '2026-10-04T23:40:00Z')])).toBe('Rook:4');
  });

  it('should cut a sitting at 24 hours even without a 6 hour gap', () => {
    const rows = Array.from(
      { length: 6 },
      (_, i) => watch(10 - i, new Date(now.getTime() - i * 5 * 3_600_000).toISOString()),
    );

    expect(signature(rows)).toBe('Rook:5 Rook:1');
  });

  it('should only extend open sittings when an older page arrives, so nothing shown moves', () => {
    const all = items(socialFeedFixture.rows(now));
    const firstPage = groupSittings(all.slice(0, 13));
    const both = groupSittings(all);

    expect(both.slice(0, firstPage.length).map(({ key }) => key)).toEqual(firstPage.map(({ key }) => key));
    expect(both.find(({ key }) => key === 'sample-mmf:rating:9')?.items).toHaveLength(4);
    expect(firstPage.find(({ key }) => key === 'sample-mmf:rating:9')?.items).toHaveLength(2);
  });
});
