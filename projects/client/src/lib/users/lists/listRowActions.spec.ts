import { describe, expect, it } from 'vitest';
import { listRowActions } from './listRowActions.ts';
import type { UserListRow } from './UserListRow.ts';

const row = (fields: Partial<UserListRow> = {}): UserListRow => ({
  key: 'list-42',
  id: 42,
  kind: 'personal',
  href: '/users/owner/lists/heist',
  name: 'Heist',
  owner: { slug: 'owner', name: 'Owner', href: '/users/owner', avatar: '', vip: null },
  posters: [],
  itemCount: 0,
  pills: [],
  shareLink: false,
  isPublic: true,
  updatedAt: '',
  rank: 1,
  ...fields,
});
const origin = 'https://og.trakt.tv';
const icons = (actions: object) => Object.keys(actions).toSorted();

describe('listRowActions', () => {
  it('should give a signed-out viewer only share', () => {
    expect(listRowActions({ row: row(), viewer: null, isCollaborator: false, origin })).toEqual({
      shareUrl: 'https://og.trakt.tv/users/owner/lists/heist',
    });
  });

  it('should give the owner edit and delete, and their own progress page', () => {
    const actions = listRowActions({
      row: row(),
      viewer: { slug: 'owner' },
      isCollaborator: false,
      origin,
    });
    expect(icons(actions)).toEqual(['delete', 'edit', 'progressHref', 'report', 'shareUrl']);
    expect(actions.progressHref).toBe('/users/owner/progress?list=42');
  });

  it('should not let the owner delete the watchlist, and link its progress by owner', () => {
    const watchlist = row({ key: 'watchlist', id: null, kind: 'watchlist', href: '/users/owner/watchlist' });
    const actions = listRowActions({
      row: watchlist,
      viewer: { slug: 'owner' },
      isCollaborator: false,
      origin,
    });
    expect(icons(actions)).toEqual(['edit', 'progressHref', 'report', 'shareUrl']);
    expect(actions.progressHref).toBe('/users/owner/progress?list=owner/watchlist');
  });

  it('should let a collaborator stop collaborating, but not the owner', () => {
    const viewer = { slug: 'friend' };
    expect(icons(listRowActions({ row: row(), viewer, isCollaborator: true, origin }))).toEqual([
      'leave',
      'progressHref',
      'report',
      'shareUrl',
    ]);
    expect(
      listRowActions({ row: row(), viewer: { slug: 'owner' }, isCollaborator: true, origin }).leave,
    ).toBeUndefined();
  });

  it("should link a built-in row's progress for any signed-in viewer", () => {
    const builtIn = row({ id: null, kind: 'favorites' });
    expect(listRowActions({ row: builtIn, viewer: null, isCollaborator: false, origin })).not.toHaveProperty(
      'progressHref',
    );
    expect(
      listRowActions({ row: builtIn, viewer: { slug: 'friend' }, isCollaborator: false, origin }).progressHref,
    ).toBe('/users/friend/progress?list=owner/favorites');
  });

  it('should leave progress off official lists', () => {
    const official = row({ kind: 'official', href: '/lists/official/x' });
    expect(listRowActions({ row: official, viewer: null, isCollaborator: false, origin }).progressHref).toBeUndefined();
  });
});
