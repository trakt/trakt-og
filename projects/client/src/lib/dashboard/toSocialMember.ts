import type { z } from 'zod/v4';
import type { socialMemberSchema } from './socialMemberSchema.ts';
import type { SocialMember } from './toSocialItem.ts';
import { PLACEHOLDER_AVATAR } from '../users/placeholderAvatar.ts';

/** A member as the Social Feed shows them. A deleted member keeps their username as the key, with no link. */
export function toSocialMember(user: z.infer<typeof socialMemberSchema>): SocialMember {
  if (user.deleted || !user.ids.slug) return { key: user.username, name: 'Deleted User', avatar: PLACEHOLDER_AVATAR };

  const { slug } = user.ids;
  const avatar = user.images?.avatar.full ?? PLACEHOLDER_AVATAR;
  return { key: user.username, name: user.name?.trim() || user.username, slug, href: `/users/${slug}`, avatar };
}
