import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';

/** Whether the member can open `/live`: VIPs, and directors. */
export function canSeeLive<User extends Pick<HeaderUser, 'isVip' | 'isDirector'>>(
  user: User | null | undefined,
): user is User {
  return user?.isVip === true || user?.isDirector === true;
}
