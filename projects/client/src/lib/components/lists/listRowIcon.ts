import bookmark from '../../icons/solid/bookmark.svg?raw';
import lock from '../../icons/solid/lock-keyhole.svg?raw';
import link from '../../icons/solid/link.svg?raw';
import listRegular from '../../icons/regular/list.svg?raw';
import friends from '../../icons/trakt/friends-thick.svg?raw';
import type { PickerList } from './PickerList.ts';

export interface ListRowIcon {
  readonly svg: string;
  /** The glyphs a picker scales so the names stay lined up. */
  readonly size?: 'people' | 'link';
}

const PRIVACY: Readonly<Record<string, ListRowIcon>> = {
  private: { svg: lock },
  link: { svg: link, size: 'link' },
  friends: { svg: friends, size: 'people' },
};

/**
 * A list picker row's leading icon: the bookmark for the watchlist (`null`), the people for a collaboration, else the
 * list's privacy, with the plain list for a public one.
 */
export function listRowIcon(list: Pick<PickerList, 'privacy' | 'collaboration'> | null): ListRowIcon {
  if (!list) return { svg: bookmark };
  if (list.collaboration) return { svg: friends, size: 'people' };
  return PRIVACY[list.privacy] ?? { svg: listRegular };
}
