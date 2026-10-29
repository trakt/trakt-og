import { describe, expect, it } from 'vitest';
import { listTitleActions } from './listTitleActions.ts';

const list = { id: 7, kind: 'personal', ownerSlug: 'sean', href: '/users/sean/lists/heist' } as const;
const origin = 'https://og.trakt.tv';
const keys = (actions: object) => Object.keys(actions).sort();

describe('listTitleActions', () => {
  it('should give a signed-out viewer share, but no progress or copy', () => {
    const actions = listTitleActions({ list, viewer: null, isCollaborator: false, origin });
    expect(keys(actions)).toEqual(['shareUrl']);
    expect(actions.shareUrl).toBe('https://og.trakt.tv/users/sean/lists/heist');
  });

  it('should give the owner edit, delete and manage', () => {
    const actions = listTitleActions({ list, viewer: { slug: 'sean' }, isCollaborator: false, origin });
    expect(keys(actions)).toEqual(['delete', 'edit', 'manage', 'progressHref', 'report', 'shareUrl']);
    expect(actions.progressHref).toBe('/users/sean/progress?list=7');
  });

  it('should give a collaborator leave and manage', () => {
    const actions = listTitleActions({ list, viewer: { slug: 'kim' }, isCollaborator: true, origin });
    expect(keys(actions)).toEqual(['leave', 'manage', 'progressHref', 'report', 'shareUrl']);
  });

  it('should give official lists no management or copy, even for the owner', () => {
    const official = { ...list, kind: 'official' as const };
    const actions = listTitleActions({
      list: official,
      viewer: { slug: 'sean' },
      isCollaborator: false,
      origin,
    });
    expect(actions.progressHref).toBeUndefined();
    expect(keys(actions)).toEqual(['report', 'shareUrl']);
    expect(keys(listTitleActions({ list: official, viewer: { slug: 'kim' }, isCollaborator: true, origin }))).toEqual([
      'report',
      'shareUrl',
    ]);
  });

  it("should link a watchlist's progress by its owner, with or without its id", () => {
    expect(
      listTitleActions({
        list: { ...list, kind: 'watchlist', id: 0 },
        viewer: { slug: 'kim' },
        isCollaborator: false,
        origin,
      }).progressHref,
    ).toBe('/users/kim/progress?list=sean/watchlist');
  });

  it('should give a watchlist owner edit and manage, but no delete', () => {
    const watchlist = { ...list, kind: 'watchlist' as const, href: '/users/sean/watchlist' };
    const actions = listTitleActions({
      list: watchlist,
      viewer: { slug: 'sean' },
      isCollaborator: false,
      origin,
    });
    expect(keys(actions)).toEqual(['edit', 'manage', 'progressHref', 'report', 'shareUrl']);
    expect(actions.shareUrl).toBe('https://og.trakt.tv/users/sean/watchlist');
  });
});
