import type { SmartList } from '../../lists/smart/SmartList.ts';
import { smartListPath } from '../../lists/smart/smartListPath.ts';
import { smartListSourceLabel } from '../../lists/smart/smartListSourceLabel.ts';
import { imageUrl } from '../../utils/imageUrl.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import type { UserListRow } from './UserListRow.ts';

type Params = {
  list: SmartList;
  profile: Pick<ProfileUser, 'slug' | 'displayName' | 'avatarUrl' | 'vip'>;
  /** Its 1-based place in the order the API sent. */
  rank: number;
};

const PILLS = { public: [], private: ['Private'], friends: ['Following'] } as const;

/**
 * A smart list as a lists index row: its Smart tag and privacy, and where its titles come from in place of a
 * description. Its count and posters load as the row scrolls in, unless the list sent its posters.
 */
export function toSmartListRow({ list, profile, rank }: Params): UserListRow {
  const href = `/users/${profile.slug}`;
  return {
    key: `smart-${list.id}`,
    id: null,
    kind: 'smart',
    smart: list,
    href: smartListPath(profile.slug, list.slug),
    name: list.name,
    owner: { slug: profile.slug, name: profile.displayName, href, avatar: profile.avatarUrl, vip: profile.vip },
    posters: list.posters.slice(0, 5).map((path) => ({ image: imageUrl(path, 'thumb') })),
    itemCount: 0,
    pills: ['Smart', ...PILLS[list.privacy]],
    description: `Fills itself from ${smartListSourceLabel(list.source, list.mediaType)}.`,
    shareLink: false,
    isPublic: list.privacy === 'public',
    updatedAt: list.updatedAt,
    rank,
  };
}
