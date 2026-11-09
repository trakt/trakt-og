import type { CommentResponse } from '@trakt/api';
import { toVipBadge } from '../../users/toVipBadge.ts';
import type { VipBadge } from '../../users/VipBadge.ts';
import { userAvatar } from '../../images/userAvatar.ts';
import { PLACEHOLDER_AVATAR } from '../../users/placeholderAvatar.ts';

export type CommentAuthor = {
  readonly name: string;
  /** Left out for deleted members, whose name isn't a link. */
  readonly href?: string;
  readonly slug?: string;
  readonly avatar: string;
  /** The VIP or Director label after the name. */
  readonly badge: VipBadge | null;
};

/** The author row's member. A deleted member shows as "Deleted User". */
export function authorOf(user: CommentResponse['user']): CommentAuthor {
  if (user.deleted || !user.ids.slug) {
    return { name: 'Deleted User', avatar: PLACEHOLDER_AVATAR, badge: null };
  }

  return {
    name: user.name?.trim() || user.username,
    href: `/users/${user.ids.slug}`,
    slug: user.ids.slug,
    avatar: user.private || !user.ids.trakt ? PLACEHOLDER_AVATAR : userAvatar(user.ids.trakt),
    badge: toVipBadge(user),
  };
}
