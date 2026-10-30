import { describe, expect, it } from 'vitest';
import { toHeaderUser } from './toHeaderUser.ts';

const user = {
  username: 'sean',
  name: 'Sean Rudford',
  vip: true,
  ids: { slug: 'sean' },
  images: { avatar: { full: 'https://walter-r2.trakt.tv/images/users/000/000/001/avatars/large/abc.jpg' } },
};

describe('toHeaderUser', () => {
  it('maps the settings user to what the header shows', () => {
    expect(toHeaderUser(user)).toEqual({
      slug: 'sean',
      firstName: 'Sean',
      displayName: 'Sean Rudford',
      avatarUrl: user.images.avatar.full,
      isVip: true,
      joinedAt: null,
      named: true,
    });
  });

  it('carries the join date and whether a name is set, for the getting-started pill', () => {
    const fresh = toHeaderUser({ ...user, name: null, joined_at: '2026-10-20T00:00:00.000Z' });
    expect(fresh.joinedAt).toBe('2026-10-20T00:00:00.000Z');
    expect(fresh.named).toBe(false);
  });

  it('falls back to the username when there is no name', () => {
    expect(toHeaderUser({ ...user, name: null }).firstName).toBe('sean');
    expect(toHeaderUser({ ...user, name: '  ' }).firstName).toBe('sean');
  });
});
