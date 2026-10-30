import { describe, expect, it } from 'vitest';
import bookmark from '../../icons/solid/bookmark.svg?raw';
import lock from '../../icons/solid/lock-keyhole.svg?raw';
import link from '../../icons/solid/link.svg?raw';
import listRegular from '../../icons/regular/list.svg?raw';
import friends from '../../icons/trakt/friends-thick.svg?raw';
import { listRowIcon } from './listRowIcon.ts';

describe('util: listRowIcon', () => {
  it('should mark the watchlist with the bookmark', () => {
    expect(listRowIcon(null)).toEqual({ svg: bookmark });
  });

  it('should show the people for a collaboration, whatever its privacy', () => {
    expect(listRowIcon({ privacy: 'private', collaboration: true })).toEqual({ svg: friends, size: 'people' });
  });

  it("should show an own list's privacy", () => {
    expect(listRowIcon({ privacy: 'private', collaboration: false })).toEqual({ svg: lock });
    expect(listRowIcon({ privacy: 'link', collaboration: false })).toEqual({ svg: link, size: 'link' });
    expect(listRowIcon({ privacy: 'friends', collaboration: false })).toEqual({ svg: friends, size: 'people' });
  });

  it('should fall back to the plain list for a public list', () => {
    expect(listRowIcon({ privacy: 'public', collaboration: false })).toEqual({ svg: listRegular });
  });
});
