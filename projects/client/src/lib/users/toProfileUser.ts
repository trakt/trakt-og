import type { ProfileUser } from './ProfileUser.ts';
import { userAvatar } from '../images/userAvatar.ts';
import { webpImageUrl } from '../utils/imageUrl.ts';
import { toVipBadge } from './toVipBadge.ts';
import { PLACEHOLDER_AVATAR } from './placeholderAvatar.ts';

/** The fields of `GET /users/:id?extended=full,vip` the frame reads. */
export type ProfileResponse = {
  readonly username: string;
  readonly private: boolean;
  readonly name?: string | null;
  readonly vip?: boolean | null;
  readonly vip_ep?: boolean | null;
  readonly vip_og?: boolean | null;
  readonly vip_years?: number | null;
  readonly vip_cover_image?: string | null;
  readonly director?: boolean | null;
  readonly ids: { readonly slug?: string | null; readonly trakt?: number | null };
  readonly location?: string | null;
  readonly about?: string | null;
  readonly joined_at?: string | null;
};

const DEFAULT_LOCATION = 'Omicron Persei 8';

export function toProfileUser(profile: ProfileResponse): ProfileUser {
  const displayName = profile.name?.trim() || profile.username;

  const isLocked = profile.private && profile.name === undefined;

  return {
    slug: profile.ids.slug ?? profile.username,
    username: profile.username,
    displayName,
    firstName: displayName.split(' ').at(0) ?? displayName,
    avatarUrl: profile.ids.trakt && !isLocked ? userAvatar(profile.ids.trakt) : PLACEHOLDER_AVATAR,
    isPrivate: profile.private,
    // A private profile the viewer can't see comes back as username, ids and flags only, so `name` is missing.
    isLocked,
    vip: toVipBadge(profile),
    location: profile.location?.trim() || DEFAULT_LOCATION,
    about: profile.about?.trim() || null,
    joinedAt: profile.joined_at ?? null,
    coverUrl: profile.vip_cover_image ? webpImageUrl(profile.vip_cover_image) : null,
  };
}
