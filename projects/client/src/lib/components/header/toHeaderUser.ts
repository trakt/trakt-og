import type { HeaderUser } from './HeaderUser.ts';

/** The fields of `GET /users/settings` → `user` that the header reads. */
export type SettingsUser = {
  readonly username: string;
  readonly name?: string | null;
  readonly vip: boolean;
  readonly ids: { readonly slug: string };
  readonly images: { readonly avatar: { readonly full: string } };
  readonly joined_at?: string | null;
};

/** OG's: the first word of the full name, or the username when there's no name. */
export function toHeaderUser(user: SettingsUser): HeaderUser {
  const displayName = user.name?.trim() || user.username;

  return {
    slug: user.ids.slug,
    firstName: displayName.split(' ')[0] ?? displayName,
    displayName,
    avatarUrl: user.images.avatar.full,
    isVip: user.vip,
    joinedAt: user.joined_at ?? null,
    named: !!user.name?.trim(),
  };
}
