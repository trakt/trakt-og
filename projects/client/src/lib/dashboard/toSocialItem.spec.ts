import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_AVATAR } from '../components/comments/authorOf.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { socialActivitySchema } from './socialActivitySchema.ts';
import { toSocialItem } from './toSocialItem.ts';

const now = new Date('2026-10-05T16:30:00Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const rows = socialFeedFixture.rows(now);
const item = (id: number, action = 'watch') => {
  const row = rows.find((activity) => activity.id === id && activity.action === action);
  if (!row) throw new Error(`no fixture row ${action}:${id}`);
  return toSocialItem(row, datePreferences);
};

const row17 = () => {
  const [row] = rows;
  if (!row) throw new Error('no fixture row');
  return row;
};

describe('toSocialItem', () => {
  it('should map an episode watch with its code, page, still and clock time', () => {
    expect(item(17)).toMatchObject({
      key: 'watch:17',
      kind: 'watch',
      title: { key: 'show:that-70s-show', name: "That '70s Show", href: '/shows/that-70s-show' },
      episode: { season: 3, number: 4 },
      code: '3x04',
      label: "That '70s Show 3x04",
      href: '/shows/that-70s-show/seasons/3/episodes/4',
      still: 'media.trakt.tv/images/shows/000/000/052/fanarts/medium/0ece27e5ec.jpg.webp',
      time: '4:06 PM',
      member: { key: 'sample-kristin', name: 'Kristin', slug: 'sample-kristin', href: '/users/sample-kristin' },
    });
  });

  it("should tell a check-in from a watch, and use the viewer's zone and clock", () => {
    expect(item(13).kind).toBe('checkin');
    expect(toSocialItem(row17(), { ...datePreferences, hour24: true, timeZone: 'Europe/Berlin' }).time)
      .toBe('18:06');
  });

  it('should map a movie, a show rating and a review', () => {
    expect(item(0)).toMatchObject({ label: 'Weapons', href: '/movies/weapons-2025' });
    expect(item(0)).not.toHaveProperty('code');
    expect(item(9, 'rating')).toMatchObject({ kind: 'rating', rating: 10, label: 'Lanterns', href: '/shows/lanterns' });
    expect(item(7, 'comment')).toMatchObject({
      kind: 'review',
      comment: { id: 7, likes: 11, replies: 3, spoiler: false, href: '/comments/7' },
    });
  });

  it('should map a season and a special', () => {
    const row = row17();
    const season = socialActivitySchema.parse({ ...row, type: 'season', season: { number: 2 } });
    const special = socialActivitySchema.parse({ ...row, episode: { ids: { trakt: 1 }, season: 0, number: 3 } });

    expect(toSocialItem(season, datePreferences)).toMatchObject({
      code: 'Season 2',
      href: '/shows/that-70s-show/seasons/2',
    });
    expect(toSocialItem(special, datePreferences).label).toBe("That '70s Show Special 3");
  });

  it('should show a deleted member without a link', () => {
    const row = row17();
    const deleted = socialActivitySchema.parse({
      ...row,
      user: { username: 'gone', deleted: true, ids: { slug: null } },
    });

    expect(toSocialItem(deleted, datePreferences).member).toEqual({
      key: 'gone',
      name: 'Deleted',
      avatar: PLACEHOLDER_AVATAR,
    });
  });

  it('should reject a rating out of range and a watch with no media', () => {
    const row = row17();

    expect(socialActivitySchema.safeParse({ ...row, action: 'rating', rating: 11 }).success).toBe(false);
    expect(socialActivitySchema.safeParse({ ...row, type: 'movie' }).success).toBe(false);
  });
});
